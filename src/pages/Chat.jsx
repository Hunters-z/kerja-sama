import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadDB, saveDB, currentUser, logAct } from '@/lib/db.js'
import { Pin, Reply, BellPlus, Vote, MessageCircle, FileText, Hash, X, CornerDownRight, ArrowLeft, Send, User, Lock, Plus, Trash2, Pencil } from 'lucide-react'

const MAX_FILE = 500 * 1024

// Default channel setup based on mockup
const DEFAULT_CHANNELS = [
  { id: 'ch-umum', type: 'channel', name: 'umum', topic: 'Pengumuman lintas tim, pembaruan kebijakan, dan info harian' },
  { id: 'ch-koordinasi', type: 'channel', name: 'koordinasi-kerja', topic: 'Diskusi progres tugas, tindak lanjut rapat, dan kendala lapangan' },
  { id: 'ch-material', type: 'channel', name: 'material-supply', topic: 'Permintaan barang, stok bahan, dan logistik proyek' },
  { id: 'ch-keuangan', type: 'channel', name: 'keuangan-admin', topic: 'Persetujuan anggaran, rekap biaya, dan administrasi keuangan' },
  { id: 'dm-budi', type: 'dm', name: 'Budi Lapangan', online: true },
  { id: 'dm-admin', type: 'dm', name: 'Admin Lapangan', online: true },
]

export default function Chat() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const nav = useNavigate()
  const [activeChannelId, setActiveChannelId] = useState('ch-umum')
  const [mobileShowThread, setMobileShowThread] = useState(false)
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [pollMode, setPollMode] = useState(false)
  const [pollQ, setPollQ] = useState('')
  const [pollOpts, setPollOpts] = useState(['', ''])
  const [replyTo, setReplyTo] = useState(null)
  const [pinned, setPinned] = useState(null)
  const [addChannelOpen, setAddChannelOpen] = useState(false)
  const [newChName, setNewChName] = useState('')
  const [newChTopic, setNewChTopic] = useState('')
  const [editingChId, setEditingChId] = useState(null)
  const [editChName, setEditChName] = useState('')
  const [editChTopic, setEditChTopic] = useState('')
  const [deleteChId, setDeleteChId] = useState(null)
  const bottomRef = useRef(null)
  const refresh = () => setDb(loadDB())
  const persist = next => { saveDB(next); setDb(next) }

  // Ensure channels exist in DB for this team
  useEffect(() => {
    const next = { ...db }
    let changed = false
    DEFAULT_CHANNELS.forEach(dc => {
      if (!next.channels) next.channels = []
      if (!next.channels.find(c => c.id === dc.id && c.teamId === user.teamId)) {
        next.channels.push({ ...dc, teamId: user.teamId, unread: 0 })
        changed = true
      }
    })
    if (changed) persist(next)
  }, [db.channels, user.teamId])

  const channels = db.channels?.filter(c => c.teamId === user.teamId) || []
  const activeChannel = channels.find(c => c.id === activeChannelId) || { id: 'ch-umum', name: 'umum', topic: 'Kanal umum', type: 'channel' }
  const teamMsgs = db.messages.filter(m => m.channelId === activeChannelId)
  const teamPolls = db.polls.filter(p => p.channelId === activeChannelId)

  useEffect(() => {
    const marked = { ...db, messages: db.messages.map(m => m.channelId === activeChannelId ? { ...m, readBy: [...new Set([...(m.readBy || []), user.id])] } : m) }
    saveDB(marked)
    const t = setInterval(refresh, 3000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [activeChannelId])

  useEffect(() => {
    const t = setInterval(refresh, 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [teamMsgs.length, teamPolls.length, activeChannelId])

  const send = e => {
    e.preventDefault()
    if (pollMode) {
      const opts = pollOpts.filter(o => o.trim())
      if (!pollQ.trim() || opts.length < 2) return
      const next = { ...db, polls: [...(db.polls || []), { id: 'p' + Date.now(), teamId: user.teamId, channelId: activeChannelId, q: pollQ, options: opts, votes: {}, by: user.name, closed: false }] }
      logAct(next, { name: user.name, teamId: user.teamId }, 'membuat voting di kanal #' + activeChannel.name, 'vote')
      persist(next); setPollQ(''); setPollOpts(['', '']); setPollMode(false)
      return
    }
    if (!text.trim() && !file) return
    const base = { id: 'm' + Date.now(), teamId: user.teamId, channelId: activeChannelId, userId: user.id, name: user.name, role: 'Anggota', text: text.trim(), file: null, at: new Date().toISOString(), replyTo: replyTo ? (replyTo.name + ': ' + replyTo.text.slice(0, 80)) : null, reactions: [] }
    const finish = next => { persist(next); setText(''); setFile(null); setReplyTo(null); if (document.getElementById('zk-file')) document.getElementById('zk-file').value = '' }
    if (file) {
      if (file.size > MAX_FILE) { alert('File maksimal 500 KB (mode demo).'); return }
      const reader = new FileReader()
      reader.onload = () => finish({ ...db, messages: [...db.messages, { ...base, file: { name: file.name, type: file.type, data: reader.result } }] })
      reader.readAsDataURL(file)
    } else finish({ ...db, messages: [...db.messages, base] })
  }

  const votePoll = (pollId, optIdx) => persist({ ...db, polls: db.polls.map(p => p.id === pollId ? { ...p, votes: { ...p.votes, [user.id]: optIdx } } : p) })
  const closePoll = pollId => { const next = { ...db, polls: db.polls.map(p => p.id === pollId ? { ...p, closed: true } : p) }; logAct(next, { name: user.name, teamId: user.teamId }, 'menutup voting', 'lock'); persist(next) }
  const pinMsg = m => {
    const next = { ...db, messages: db.messages.map(msg => ({ ...msg, pinned: msg.id === m.id ? !msg.pinned : false })) }
    persist(next)
    setPinned(pinned?.id === m.id ? null : m)
  }
  const toTask = m => {
    const t = { id: 't' + Date.now(), teamId: user.teamId, title: m.text.slice(0, 80) || ('Lampiran dari ' + m.name), assignee: user.id, status: 'To Do', priority: 'Sedang', project: 'Operasional', pinned: true, deadline: new Date().toISOString().slice(0, 10), note: 'Dibuat dari pesan diskusi #' + activeChannel.name + ': ' + m.text, subtasks: [] }
    const next = { ...db, tasks: [t, ...db.tasks] }
    logAct(next, { name: user.name, teamId: user.teamId }, 'mengubah pesan diskusi menjadi pengingat pekerjaan', 'bell-plus')
    persist(next); alert('✓ Berhasil dijadikan pengingat pekerjaan')
    nav('/tugas?open=' + t.id)
  }
  const time = iso => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const pinnedMessageInChannel = teamMsgs.find(m => m.pinned)

  const addChannel = () => {
    if (!newChName.trim()) return
    const ch = { id: 'ch-' + Date.now(), type: 'channel', name: newChName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'), topic: newChTopic.trim() || 'Kanal diskusi baru', teamId: user.teamId, unread: 0 }
    const next = { ...db, channels: [...(db.channels || []), ch] }
    logAct(next, { name: user.name, teamId: user.teamId }, 'menambahkan kanal diskusi #' + ch.name, 'hash')
    persist(next)
    setNewChName(''); setNewChTopic(''); setAddChannelOpen(false)
    setActiveChannelId(ch.id)
  }
  const deleteChannel = id => {
    const ch = channels.find(c => c.id === id)
    if (!ch) return
    const next = { ...db, channels: (db.channels || []).filter(c => c.id !== id), messages: db.messages.filter(m => m.channelId !== id), polls: (db.polls || []).filter(p => p.channelId !== id) }
    persist(next)
    if (activeChannelId === id) setActiveChannelId('ch-umum')
  }
  const startEditChannel = ch => { setEditingChId(ch.id); setEditChName(ch.name); setEditChTopic(ch.topic || '') }
  const saveEditChannel = () => {
    const next = { ...db, channels: (db.channels || []).map(c => c.id === editingChId ? { ...c, name: editChName.trim() || c.name, topic: editChTopic.trim() } : c) }
    persist(next)
    setEditingChId(null)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-line bg-white shadow-hairline overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-1 md:grid-cols-12 h-[72vh] min-h-[540px]">

          {/* Left Channels & DMs */}
          <div className={(mobileShowThread ? 'hidden md:flex' : 'flex') + ' md:col-span-4 lg:col-span-3 flex-col border-r border-line bg-subtle dark:border-zinc-800 dark:bg-zinc-950/40'}>
            <div className="p-3.5 border-b border-line dark:border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-inksoft">Kanal Diskusi</span>
              <button onClick={() => setAddChannelOpen(true)} title="Tambah Kanal" className="rounded p-1 text-inksoft hover:bg-subtle dark:hover:bg-zinc-800 transition">
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              {addChannelOpen && (
                <div className="mx-2 mb-2 rounded-lg border border-line bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900 space-y-2">
                  <input value={newChName} onChange={e => setNewChName(e.target.value)} placeholder="Nama kanal (opsi)..."
                    className="w-full rounded-md border border-line bg-canvas px-2 py-1.5 text-xs focus:border-zinc-400 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-ink" />
                  <input value={newChTopic} onChange={e => setNewChTopic(e.target.value)} placeholder="Deskripsi singkat..."
                    className="w-full rounded-md border border-line bg-canvas px-2 py-1.5 text-xs focus:border-zinc-400 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-ink" />
                  <div className="flex items-center gap-2">
                    <button onClick={addChannel} className="flex-1 rounded-md bg-ink text-white text-[11px] font-medium py-1.5 hover:opacity-90 transition dark:bg-zinc-100 dark:text-zinc-900">Simpan</button>
                    <button onClick={() => setAddChannelOpen(false)} className="flex-1 rounded-md border border-line text-inksoft text-[11px] font-medium py-1.5 hover:bg-subtle transition dark:border-zinc-700">Batal</button>
                  </div>
                </div>
              )}

              <div className="space-y-0.5">
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-dim">Saluran Kerja</div>
                {channels.filter(c => c.type === 'channel').map(ch => (
                  <div key={ch.id} className="relative group/ch">
                    <button onClick={() => { setActiveChannelId(ch.id); setMobileShowThread(true); setPinned(null); setReplyTo(null) }}
                      className={(activeChannelId === ch.id ? 'bg-white text-ink font-semibold shadow-hairline border border-line dark:bg-zinc-800 dark:text-white dark:border-zinc-700' : 'text-inksoft hover:bg-subtle dark:text-zinc-400 dark:hover:bg-zinc-800/50') + ' flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition'}>
                      <span className="flex items-center gap-2 truncate">
                        <Hash className="h-3.5 w-3.5 text-dim shrink-0" strokeWidth={1.5} />
                        <span className="truncate">{ch.name}</span>
                      </span>
                      {ch.unread > 0 && <span className="rounded-full bg-ink dark:bg-zinc-100 px-1.5 py-0.2 font-mono text-[10px] text-white dark:text-zinc-900">{ch.unread}</span>}
                    </button>
                    <div className="absolute right-1 top-1 hidden group-hover/ch:flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); startEditChannel(ch) }} className="p-1 rounded hover:bg-subtle text-dim hover:text-ink dark:hover:bg-zinc-700 transition">
                        <Pencil className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteChannel(ch.id) }} className="p-1 rounded hover:bg-subtle text-dim hover:text-rose-600 dark:hover:bg-zinc-700 transition">
                        <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    </div>
                    {editingChId === ch.id && (
                      <div className="mt-1 ml-1 space-y-1.5">
                        <input value={editChName} onChange={e => setEditChName(e.target.value)} onBlur={() => saveEditChannel()} onKeyDown={e => e.key === 'Enter' && saveEditChannel()}
                          className="w-full rounded-md border border-line bg-white px-2 py-1 text-[11px] focus:border-zinc-400 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-ink" autoFocus />
                        <input value={editChTopic} onChange={e => setEditChTopic(e.target.value)} onBlur={() => saveEditChannel()} onKeyDown={e => e.key === 'Enter' && saveEditChannel()}
                          className="w-full rounded-md border border-line bg-white px-2 py-1 text-[11px] focus:border-zinc-400 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-ink" placeholder="Topik..." />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-0.5">
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-dim">Pesan Langsung</div>
                {channels.filter(c => c.type === 'dm').map(ch => (
                  <button key={ch.id} onClick={() => { setActiveChannelId(ch.id); setMobileShowThread(true); setPinned(null); setReplyTo(null) }}
                    className={(activeChannelId === ch.id ? 'bg-white text-ink font-semibold shadow-hairline border border-line dark:bg-zinc-800 dark:text-white dark:border-zinc-700' : 'text-inksoft hover:bg-subtle dark:text-zinc-400 dark:hover:bg-zinc-800/50') + ' flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition'}>
                    <span className="flex items-center gap-2 truncate">
                      <span className={(ch.online ? 'bg-emerald-600' : 'bg-zinc-300') + ' h-1.5 w-1.5 rounded-full shrink-0'} />
                      <span className="truncate">{ch.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Conversation Feed */}
          <div className={(mobileShowThread ? 'flex' : 'hidden md:flex') + ' md:col-span-8 lg:col-span-9 flex-col bg-white dark:bg-zinc-900 min-h-[540px]'}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <button onClick={() => setMobileShowThread(false)} className="md:hidden rounded-lg p-1.5 text-inksoft hover:bg-subtle dark:hover:bg-zinc-800 transition">
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-semibold text-ink dark:text-white flex items-center gap-1.5 truncate">
                    {activeChannel.type === 'dm' ? <User className="h-3.5 w-3.5 text-inksoft" strokeWidth={1.5} /> : <Hash className="h-3.5 w-3.5 text-inksoft" strokeWidth={1.5} />}
                    <span>{activeChannel.name}</span>
                  </h2>
                  <p className="text-[11px] text-dim truncate">{activeChannel.topic}</p>
                </div>
              </div>

              <button onClick={() => setPollMode(true)}
                className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-medium text-inksoft hover:text-ink dark:border-zinc-700 dark:text-zinc-300 transition">
                <Vote className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Sisipkan Voting</span>
              </button>
            </div>

            {/* Pinned Message Strip */}
            {pinnedMessageInChannel && (
              <div className="flex items-center justify-between gap-2 border-b border-line bg-subtle px-4 py-2 text-[11px] text-inksoft dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300">
                <div className="flex items-center gap-2 min-w-0">
                  <Pin className="h-3.5 w-3.5 text-zinc-600 shrink-0" strokeWidth={1.5} />
                  <span className="font-medium text-ink dark:text-white shrink-0">Disematkan:</span>
                  <span className="truncate">{pinnedMessageInChannel.text}</span>
                </div>
                <button onClick={() => setPinned(null)} className="text-dim hover:text-ink dark:hover:text-zinc-200">
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            )}

            {/* Messages */}
            <div ref={bottomRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {teamMsgs.length === 0 && teamPolls.length === 0 && (
                <div className="text-center py-16">
                  <div className="mx-auto w-16 h-16 rounded-full bg-subtle dark:bg-zinc-900 border border-line dark:border-zinc-800 flex items-center justify-center mb-3">
                    <MessageCircle className="w-8 h-8 text-dim dark:text-zinc-600" strokeWidth={1} />
                  </div>
                  <p className="text-sm font-medium text-inksoft dark:text-zinc-400">Belum ada pesan di kanal ini.</p>
                  <p className="text-[11px] text-dim dark:text-zinc-500 mt-1">Mulai percakapan atau buat voting tim 👇</p>
                </div>
              )}

              {teamMsgs.map(m => {
                return (
                  <div key={m.id} className="group relative flex items-start gap-3 rounded-lg p-2 -mx-2 hover:bg-subtle dark:hover:bg-zinc-800/40 transition">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-subtle font-mono text-[11px] font-semibold text-ink dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      {m.name?.charAt(0) || 'A'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-ink dark:text-white">{m.name}</span>
                        <span className="text-[10px] text-dim">{m.role}</span>
                        <span className="font-mono text-[10px] text-dim">{time(m.at)}</span>
                      </div>

                      {m.replyTo && (
                        <div className="mt-1 mb-1.5 flex items-center gap-1.5 border-l-2 border-zinc-300 pl-2.5 text-[11px] text-dim dark:border-zinc-600">
                          <CornerDownRight className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                          <span className="truncate">{m.replyTo}</span>
                        </div>
                      )}

                      <p className="mt-0.5 text-xs sm:text-sm text-ink/90 dark:text-zinc-200 leading-relaxed whitespace-pre-line">{m.text}</p>

                      {m.file && (
                        <a href={m.file.data} download={m.file.name} className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-semibold border border-line dark:border-zinc-700 bg-subtle dark:bg-zinc-800 hover:bg-canvas dark:hover:bg-zinc-800/80 transition">
                          <FileText className="w-4 h-4" strokeWidth={1.5} />
                          {m.file.name}
                        </a>
                      )}

                      {/* Embedded Poll */}
                      {teamPolls.find(p => p.channelId === activeChannelId && p.id === m.pollId) && (() => {
                        const poll = teamPolls.find(p => p.id === m.pollId)
                        const totalVotes = Object.keys(poll.votes || {}).length
                        return (
                          <div className="mt-2.5 w-full max-w-sm sm:max-w-md rounded-xl border border-line bg-subtle p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-inksoft">
                                <Vote className="h-3 w-3" strokeWidth={1.5} /> Voting Keputusan
                              </span>
                              <span className="font-mono text-[10px] text-dim">{poll.closed ? 'Final' : 'Aktif'}</span>
                            </div>
                            <p className="text-xs font-semibold text-ink dark:text-white mb-2.5">{poll.q}</p>
                            <div className="space-y-1.5">
                              {poll.options.map((opt, i) => {
                                const count = Object.values(poll.votes || {}).filter(v => v === i).length
                                const pc = totalVotes ? Math.round(count / totalVotes * 100) : 0
                                const mine = poll.votes?.[user.id] === i
                                return (
                                  <button key={i} disabled={poll.closed} onClick={() => votePoll(poll.id, i)}
                                    className="relative w-full overflow-hidden rounded-lg border border-line bg-white px-3 py-2 text-left text-xs transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 disabled:opacity-50">
                                    <div className="absolute inset-y-0 left-0 bg-zinc-500/10 transition-all duration-300" style={{ width: pc + '%' }} />
                                    <div className="relative flex items-center justify-between gap-2">
                                      <span className="flex items-center gap-1.5 font-medium text-ink dark:text-zinc-100">
                                        {mine && <span className="text-zinc-600 dark:text-zinc-300 text-[10px]">✓</span>}
                                        <span>{opt}</span>
                                      </span>
                                      <span className="font-mono text-[11px] text-inksoft">{pc}%</span>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                            {!poll.closed && poll.by === user.name && (
                              <div className="flex justify-end mt-2">
                                <button onClick={() => closePoll(poll.id)} className="text-[10px] font-medium text-dim hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1">
                                  <Lock className="h-3 w-3" strokeWidth={1.5} /> Tutup Voting
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Action Toolbar */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button onClick={() => toTask(m)}
                          className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-0.5 text-[10px] font-medium text-inksoft hover:border-zinc-300 hover:text-ink dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition">
                          <BellPlus className="h-3 w-3" strokeWidth={1.5} />
                          <span>Jadikan Pengingat / Tugas</span>
                        </button>
                        <button onClick={() => setReplyTo(m)} className="text-[10px] text-dim hover:text-ink dark:hover:text-zinc-200 flex items-center gap-1">
                          <Reply className="h-3 w-3" strokeWidth={1.5} /> Balas
                        </button>
                        <button onClick={() => pinMsg(m)} className="text-[10px] text-dim hover:text-ink dark:hover:text-zinc-200 flex items-center gap-1">
                          <Pin className="h-3 w-3" strokeWidth={1.5} /> Sematkan
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Reply Banner */}
            {replyTo && (
              <div className="flex items-center justify-between border-t border-line bg-subtle px-4 py-1.5 text-[11px] text-inksoft dark:border-zinc-800 dark:bg-zinc-950">
                <span className="truncate">Membalas <strong className="text-ink dark:text-zinc-200">{replyTo.name}</strong>: <span className="opacity-70">{replyTo.text.slice(0, 40)}</span></span>
                <button onClick={() => setReplyTo(null)} className="text-dim hover:text-ink"><X className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
              </div>
            )}

            {/* Composer */}
            <form onSubmit={send} className="border-t border-line p-3 dark:border-zinc-800 flex items-center gap-2">
              <button type="button" onClick={() => setPollMode(true)} title="Buat voting"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-dim hover:border-zinc-400 hover:text-ink transition dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                <Vote className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <label title="Kirim file" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-dim hover:border-zinc-400 hover:text-ink cursor-pointer transition dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                <FileText className="w-4 h-4" strokeWidth={1.5} />
                <input id="zk-file" type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
              </label>
              <input value={text} onChange={e => setText(e.target.value)}
                placeholder={'Tulis pesan di #' + activeChannel.name + '...'}
                className="w-full rounded-lg border border-line bg-subtle px-3.5 py-2 text-xs sm:text-sm text-ink placeholder-dim focus:border-zinc-400 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white transition" />
              <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-xs font-medium text-white hover:opacity-90 transition shrink-0 dark:bg-zinc-100 dark:text-zinc-900">
                <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Kirim</span>
              </button>
            </form>

            {/* Poll Composer */}
            {pollMode && (
              <div className="border-t border-line p-3 space-y-2 bg-subtle dark:bg-zinc-950/60 dark:border-zinc-800">
                <div className="flex items-center justify-between text-[11px] font-semibold text-inksoft">
                  <span>Buat Voting Baru di #{activeChannel.name}</span>
                  <button onClick={() => setPollMode(false)} className="text-dim hover:text-ink">Batal</button>
                </div>
                <input value={pollQ} onChange={e => setPollQ(e.target.value)} placeholder="Pertanyaan untuk tim..."
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-ink" />
                {pollOpts.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-dim w-4 text-center">{i + 1}.</span>
                    <input value={o} onChange={e => setPollOpts(pollOpts.map((x, j) => j === i ? e.target.value : x))}
                      placeholder={'Pilihan ' + (i + 1)}
                      className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-ink" />
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPollOpts([...pollOpts, ''])} className="text-[12px] font-medium text-inksoft hover:underline">+ Pilihan baru</button>
                  <button type="submit" onClick={send} className="ml-auto px-4 py-2 rounded-lg bg-ink text-white text-xs font-bold hover:opacity-90 transition">Publikasikan</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
