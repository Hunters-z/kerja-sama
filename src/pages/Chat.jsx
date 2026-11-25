import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadDB, saveDB, currentUser, logAct } from '@/lib/db.js'
import { Pin, Reply, BellPlus, Vote, MessageCircle, FileText, UserPlus } from 'lucide-react'

const MAX_FILE = 500 * 1024
export default function Chat() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const nav = useNavigate()
  const [currentTopic, setCurrentTopic] = useState('General')
  const topics = ['General', 'Lapangan', 'Material', 'Keuangan']
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [pollMode, setPollMode] = useState(false)
  const [pollQ, setPollQ] = useState('')
  const [pollOpts, setPollOpts] = useState(['', ''])
  const [replyTo, setReplyTo] = useState(null)
  const [pinned, setPinned] = useState(null)
  const bottomRef = useRef(null)
  const refresh = () => setDb(loadDB())
  const persist = next => { saveDB(next); setDb(next) }

  const teamMsgs = db.messages.filter(m => m.teamId === user.teamId && (m.topic === currentTopic || (!m.topic && currentTopic === 'General')))
  const teamPolls = db.polls.filter(p => p.teamId === user.teamId && (p.topic === currentTopic || (!p.topic && currentTopic === 'General')))

  useEffect(() => {
    const marked = { ...db, messages: db.messages.map(m => m.teamId === user.teamId ? { ...m, readBy: [...new Set([...(m.readBy || []), user.id])] } : m) }
    saveDB(marked)
    const t = setInterval(refresh, 3000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [currentTopic])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [db.messages.length, teamPolls.length, currentTopic])

  const send = e => {
    e.preventDefault()
    if (pollMode) {
      const opts = pollOpts.filter(o => o.trim())
      if (!pollQ.trim() || opts.length < 2) return
      const next = { ...db, polls: [...(db.polls || []), { id: 'p' + Date.now(), teamId: user.teamId, topic: currentTopic, q: pollQ, options: opts, votes: {}, by: user.name, closed: false }] }
      logAct(next, { name: user.name, teamId: user.teamId }, 'membuat voting di diskusi #' + currentTopic, 'vote')
      persist(next); setPollQ(''); setPollOpts(['', '']); setPollMode(false)
      return
    }
    if (!text.trim() && !file) return
    const base = { id: 'm' + Date.now(), teamId: user.teamId, topic: currentTopic, userId: user.id, name: user.name, text: text.trim(), file: null, at: new Date().toISOString(), replyTo: replyTo ? (replyTo.name + ': ' + replyTo.text.slice(0, 80)) : null }
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
  const pinMsg = m => setPinned(pinned?.id === m.id ? null : m)
  const toTask = m => {
    const t = { id: 't' + Date.now(), teamId: user.teamId, title: m.text.slice(0, 80) || ('Lampiran dari ' + m.name), assignee: user.id, status: 'To Do', priority: 'Sedang', project: 'Operasional', pinned: true, deadline: new Date().toISOString().slice(0, 10), note: 'Dibuat dari pesan diskusi oleh ' + m.name, subtasks: [] }
    const next = { ...db, tasks: [t, ...db.tasks] }
    logAct(next, { name: user.name, teamId: user.teamId }, 'mengubah pesan diskusi menjadi tugas', 'bell-plus')
    persist(next); alert('✓ Pesan dijadikan tugas (disematkan). Lihat di halaman Tugas.')
    nav('/tugas?open=' + t.id)
  }
  const time = iso => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-canvas dark:bg-zinc-950 flex flex-col items-center justify-start py-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl flex flex-col h-[calc(100vh-6rem)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400" strokeWidth={1.5} />
              <h1 className="text-lg font-semibold text-ink dark:text-white">Diskusi Tim</h1>
            </div>
            <p className="text-[11px] text-dim dark:text-zinc-500 mt-0.5">Ruang percakapan & keputusan kolektif</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-emerald-700 dark:text-emerald-400">3 Aktif</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-subtle dark:bg-zinc-900 border border-line dark:border-zinc-800 text-inksoft dark:text-zinc-400">Hari ini</div>
          </div>
        </div>

        {/* Topic pills */}
        <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1">
          {topics.map(t => (
            <button key={t} onClick={() => setCurrentTopic(t)}
              className={'shrink-0 px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold transition border ' +
                (t === currentTopic ? 'bg-ink dark:bg-zinc-100 text-white dark:text-zinc-900 border-ink dark:border-zinc-100' : 'bg-transparent text-dim dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-200 border-line dark:border-zinc-800')}>
              {t}
            </button>
          ))}
        </div>

        {/* Pinned message */}
        {pinned && <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 dark:border-zinc-500/30 bg-zinc-50/50 dark:bg-zinc-500/10 px-4 py-2 text-[11px] mt-3">
          <div className="flex items-center gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 shrink-0" strokeWidth={2} />
            <span className="font-medium text-zinc-900 dark:text-zinc-300 shrink-0">Disematkan:</span>
            <span className="truncate text-inksoft dark:text-zinc-400">{pinned.text}</span>
          </div>
          <button onClick={() => setPinned(null)} className="text-dim dark:text-zinc-500 hover:text-ink dark:hover:text-zinc-200 font-bold">✕</button>
        </div>}

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto mt-4 mb-3 pr-1 space-y-4">
          {teamMsgs.length === 0 && teamPolls.length === 0 && <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-full bg-subtle dark:bg-zinc-900 border border-line dark:border-zinc-800 flex items-center justify-center mb-3">
              <MessageCircle className="w-8 h-8 text-dim dark:text-zinc-600" strokeWidth={1} />
            </div>
            <p className="text-sm font-medium text-inksoft dark:text-zinc-400">Belum ada pesan.</p>
            <p className="text-[11px] text-dim dark:text-zinc-500 mt-1">Mulai percakapan atau buat voting tim 👇</p>
          </div>}
          
          {teamMsgs.map(m => {
            const isMe = m.userId === user.id
            return (
              <div key={m.id} className={'flex flex-col ' + (isMe ? 'items-end' : 'items-start')}>
                {!isMe && <span className="text-[11px] font-semibold text-dim dark:text-zinc-500 mb-1 pl-1">{m.name}</span>}
                <div className={'max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-[13.5px] shadow-sm transition ' + (isMe ? 'bg-ink dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-br-md' : 'bg-white dark:bg-zinc-900 border border-line dark:border-zinc-800 rounded-bl-md')}>
                  {m.replyTo && <div className={'mb-1.5 border-l-2 pl-2 text-[11px] ' + (isMe ? 'border-white/30 opacity-70' : 'border-dim/30 dark:border-zinc-500/30 text-dim dark:text-zinc-500')}>↳ {m.replyTo}</div>}
                  {m.text && <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>}
                  {m.file && <a href={m.file.data} download={m.file.name} className={'mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-semibold border ' + (isMe ? 'border-white/20 bg-white/10 hover:bg-white/20' : 'border-line dark:border-zinc-700 bg-subtle dark:bg-zinc-800')}>
                    <FileText className="w-4 h-4" strokeWidth={1.5} />
                    {m.file.name}
                  </a>}
                  <div className={'mt-2.5 flex items-center gap-3 pt-2 border-t ' + (isMe ? 'border-white/10' : 'border-line/50 dark:border-zinc-800')}>
                    <span className={'text-[10px] font-mono ' + (isMe ? 'opacity-60' : 'text-dim dark:text-zinc-500')}>{time(m.at)}</span>
                    <div className="flex items-center gap-2.5">
                      <button onClick={() => setReplyTo(m)} title="Balas" className={'opacity-70 hover:opacity-100 ' + (isMe ? 'text-white dark:text-zinc-900' : '')}><Reply className="w-3.5 h-3.5" strokeWidth={1.5} /></button>
                      <button onClick={() => pinMsg(m)} title="Sematkan" className={'opacity-70 hover:opacity-100 ' + ((pinned?.id === m.id && 'text-zinc-400 !opacity-100') || (isMe ? 'text-white dark:text-zinc-900' : ''))}><Pin className="w-3.5 h-3.5" strokeWidth={1.5} /></button>
                      <button onClick={() => toTask(m)} title="Jadikan tugas" className={'opacity-70 hover:opacity-100 ' + (isMe ? 'text-white dark:text-zinc-900' : '')}><BellPlus className="w-3.5 h-3.5" strokeWidth={1.5} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          
          {teamPolls.map(p => {
            const totalVotes = Object.keys(p.votes || {}).length
            return (
              <div key={p.id} className="mx-auto w-full max-w-md rounded-2xl border border-line dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 dark:bg-zinc-500/10 px-2.5 py-1 text-[10px] font-bold text-zinc-700 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-500/20">
                      <Vote className="w-3 h-3" strokeWidth={1.5} />Voting
                    </span>
                    {p.closed && <span className="rounded-full bg-subtle dark:bg-zinc-800 px-2.5 py-0.5 text-[10px] font-medium text-inksoft dark:text-zinc-400">Ditutup</span>}
                  </div>
                  <span className="text-[11px] text-dim dark:text-zinc-500">{p.by}</span>
                </div>
                <b className="text-sm font-semibold text-ink dark:text-white block mt-3 leading-snug">{p.q}</b>
                <div className="mt-3 space-y-2">
                  {p.options.map((o, i) => {
                    const count = Object.values(p.votes || {}).filter(v => v === i).length
                    const pc = totalVotes ? Math.round(count / totalVotes * 100) : 0
                    const mine = p.votes?.[user.id] === i
                    return (
                      <button key={i} disabled={p.closed} onClick={() => votePoll(p.id, i)}
                        className={'relative w-full text-left rounded-xl border px-3.5 py-2.5 text-[13px] font-semibold overflow-hidden transition flex items-center justify-between gap-2 ' +
                          (mine ? 'border-zinc-400 dark:border-zinc-500 bg-zinc-50/50 dark:bg-zinc-500/10' : 'border-line dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-50')}>
                        {totalVotes > 0 && <span className={'absolute inset-y-0 left-0 transition-all ' + (mine ? 'bg-zinc-500/15 dark:bg-zinc-500/20' : 'bg-zinc-200 dark:bg-zinc-800')} style={{ width: pc + '%' }} />}
                        <span className="relative flex-1 truncate">{mine ? '✓ ' : ''}{o}</span>
                        {totalVotes > 0 && <span className={'relative font-mono text-[10px] ' + (mine ? 'text-zinc-600 dark:text-zinc-400' : 'text-dim dark:text-zinc-500')}>{pc}%</span>}
                      </button>
                    )
                  })}
                </div>
                <div className="text-[11px] text-dim dark:text-zinc-500 mt-3 pt-2.5 border-t border-line/50 dark:border-zinc-800 flex items-center">
                  <span>{totalVotes} suara masuk</span>
                  {!p.closed && p.by === user.name && <button onClick={() => closePoll(p.id)} className="ml-auto text-[11px] font-bold text-dim dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400">Tutup voting</button>}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply state */}
        {replyTo && <div className="flex items-center justify-between rounded-lg border border-line dark:border-zinc-800 bg-subtle dark:bg-zinc-900 px-4 py-1.5 text-[11px] mb-2">
          <span className="truncate text-inksoft dark:text-zinc-400">Membalas <b className="text-ink dark:text-zinc-200">{replyTo.name}</b>:{' '}
            <i className="not-italic opacity-70">{replyTo.text.slice(0, 40)}...</i></span>
          <button onClick={() => setReplyTo(null)} className="text-dim dark:text-zinc-500 hover:text-ink dark:hover:text-zinc-200">✕</button>
        </div>}

        {/* Composer */}
        <form onSubmit={send} className="border-t border-line dark:border-zinc-800 pt-3 pb-2">
          {pollMode ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input value={pollQ} onChange={e => setPollQ(e.target.value)} placeholder="Pertanyaan untuk tim..." className="w-full rounded-xl border border-line dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-400 dark:focus:border-zinc-500 outline-none text-ink dark:text-zinc-100" />
              </div>
              {pollOpts.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-dim dark:text-zinc-500 w-4 text-center">{i + 1}.</span>
                  <input value={o} onChange={e => setPollOpts(pollOpts.map((x, j) => j === i ? e.target.value : x))} placeholder={'Pilihan ' + (i + 1)} className="flex-1 rounded-lg border border-line dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-[13px] focus:ring-1 focus:ring-zinc-500/20 focus:border-zinc-400 dark:focus:border-zinc-500 outline-none text-ink dark:text-zinc-100" />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPollOpts([...pollOpts, ''])} className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 hover:underline">+ Pilihan baru</button>
                <button type="button" onClick={() => setPollMode(false)} className="ml-auto text-[12px] font-medium text-dim dark:text-zinc-500 hover:text-ink dark:hover:text-zinc-200">Batal</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-ink dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition">Publikasikan</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPollMode(true)} title="Buat voting" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line dark:border-zinc-700 bg-white dark:bg-zinc-900 text-dim dark:text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition">
                <Vote className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <label title="Kirim file" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line dark:border-zinc-700 bg-white dark:bg-zinc-900 text-dim dark:text-zinc-400 hover:border-zinc-400 cursor-pointer transition">
                <FileText className="w-4 h-4" strokeWidth={1.5} />
                <input id="zk-file" type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
              </label>
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Tulis pesan untuk tim..." className="flex-1 rounded-xl border border-line dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-400 dark:focus:border-zinc-500 outline-none text-ink dark:text-zinc-100" />
              <button type="submit" className="px-5 h-10 rounded-xl bg-ink dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition shrink-0">Kirim</button>
            </div>
          )}
          {file && !pollMode && <div className="text-[11.5px] text-dim dark:text-zinc-500 mt-2 px-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
            Lampiran: <b className="text-ink dark:text-zinc-200">{file.name}</b> ({Math.round(file.size / 1024)} KB)
            <button onClick={() => setFile(null)} className="ml-2 text-[10px] text-dim dark:text-zinc-500 hover:text-ink dark:hover:text-zinc-200">Hapus</button>
          </div>}
        </form>
      </div>
    </div>
  )
}