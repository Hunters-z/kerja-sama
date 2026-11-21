import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadDB, saveDB, currentUser, logAct } from '@/lib/db.js'
import { Pin, Reply, BellPlus, Vote } from 'lucide-react'

const MAX_FILE = 500 * 1024
export default function Chat() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const nav = useNavigate()
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

  const teamMsgs = db.messages.filter(m=>m.teamId===user.teamId)
  const teamPolls = db.polls.filter(p=>p.teamId===user.teamId)

  useEffect(() => {
    // tandai semua pesan dibaca
    const marked = { ...db, messages: db.messages.map(m=>m.teamId===user.teamId ? {...m, readBy:[...new Set([...(m.readBy||[]), user.id])]} : m) }
    saveDB(marked)
    const t = setInterval(refresh, 3000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [db.messages.length, teamPolls.length])

  const send = e => {
    e.preventDefault()
    if (pollMode) {
      const opts = pollOpts.filter(o=>o.trim())
      if (!pollQ.trim() || opts.length<2) return
      const next = {...db, polls:[...(db.polls||[]), {id:'p'+Date.now(), teamId:user.teamId, q:pollQ, options:opts, votes:{}, by:user.name, closed:false}]}
      logAct(next, {name:user.name, teamId:user.teamId}, 'membuat voting di diskusi', 'vote')
      persist(next); setPollQ(''); setPollOpts(['','']); setPollMode(false)
      return
    }
    if (!text.trim() && !file) return
    const base = {id:'m'+Date.now(), teamId:user.teamId, userId:user.id, name:user.name, text:text.trim(), file:null, at:new Date().toISOString(), replyTo: replyTo ? (replyTo.name+': '+replyTo.text.slice(0,80)) : null}
    const finish = next => { persist(next); setText(''); setFile(null); setReplyTo(null); if (document.getElementById('zk-file')) document.getElementById('zk-file').value = '' }
    if (file) {
      if (file.size > MAX_FILE) { alert('File maksimal 500 KB (mode demo).'); return }
      const reader = new FileReader()
      reader.onload = () => finish({...db, messages:[...db.messages, {...base, file:{name:file.name, type:file.type, data:reader.result}}]})
      reader.readAsDataURL(file)
    } else finish({...db, messages:[...db.messages, base]})
  }

  const votePoll = (pollId, optIdx) => persist({...db, polls:db.polls.map(p=>p.id===pollId ? {...p, votes:{...p.votes, [user.id]:optIdx}} : p)})
  const closePoll = pollId => { const next={...db, polls:db.polls.map(p=>p.id===pollId?{...p,closed:true}:p)}; logAct(next,{name:user.name,teamId:user.teamId},'menutup voting','lock'); persist(next) }
  const pinMsg = m => setPinned(pinned?.id===m.id ? null : m)
  const toTask = m => {
    const t = { id:'t'+Date.now(), teamId:user.teamId, title:m.text.slice(0,80)||('Lampiran dari '+m.name), assignee:user.id, status:'To Do', priority:'Sedang', project:'Operasional', pinned:true, deadline:new Date().toISOString().slice(0,10), note:'Dibuat dari pesan diskusi oleh '+m.name, subtasks:[] }
    const next = {...db, tasks:[t, ...db.tasks]}
    logAct(next, {name:user.name, teamId:user.teamId}, 'mengubah pesan diskusi menjadi tugas', 'bell-plus')
    persist(next); alert('✓ Pesan dijadikan tugas (disematkan). Lihat di halaman Tugas.')
    nav('/tugas?open='+t.id)
  }
  const time = iso => new Date(iso).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-lg font-semibold text-ink dark:text-white mb-1">Diskusi Tim</h1>
      <p className="text-xs text-inksoft mb-4">Pesan, voting, dan lampiran — bisa langsung dijadikan tugas atau pengingat.</p>

      {pinned && <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-canvas px-4 py-2 text-[11px] mb-3 dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="flex items-center gap-2 min-w-0"><Pin className="h-3.5 w-3.5 text-indigo-600 shrink-0" strokeWidth={1.5}/>
          <span className="font-medium shrink-0">Disematkan:</span><span className="truncate text-inksoft">{pinned.text}</span></div>
        <button onClick={()=>setPinned(null)} className="text-dim hover:text-ink">✕</button>
      </div>}

      <div className="card p-4 h-[55vh] overflow-y-auto mb-3 space-y-3">
        {teamMsgs.length===0 && teamPolls.length===0 && <p className="text-inksoft text-[13px] text-center py-10">Belum ada pesan. Mulai percakapan! 👋</p>}
        {teamMsgs.map(m=>(
          <div key={m.id} className={'flex flex-col '+(m.userId===user.id?'items-end':'items-start')}>
            {m.userId!==user.id && <span className="text-[11px] font-semibold text-inksoft mb-0.5">{m.name}</span>}
            <div className={'max-w-[80%] rounded-2xl px-4 py-2.5 text-[13.5px] '+(m.userId===user.id?'bg-ink text-white rounded-br-md dark:bg-zinc-100 dark:text-zinc-900':'bg-card2/60 border border-line rounded-bl-md')}>
              {m.replyTo && <div className="mb-1.5 border-l-2 border-zinc-400/60 pl-2.5 text-[11px] opacity-70">↳ {m.replyTo}</div>}
              {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
              {m.file && <a href={m.file.data} download={m.file.name} className="mt-1.5 flex items-center gap-2 rounded-xl px-3 py-2 font-semibold text-[12.5px] underline">📎 {m.file.name}</a>}
              <div className="mt-2 flex items-center gap-2">
                <span className={'text-[10px] '+(m.userId===user.id?'opacity-60':'text-inksoft')}>{time(m.at)}</span>
                <button onClick={()=>setReplyTo(m)} title="Balas" className="opacity-60 hover:opacity-100"><Reply className="h-3 w-3" strokeWidth={1.5}/></button>
                <button onClick={()=>pinMsg(m)} title="Sematkan" className={'opacity-60 hover:opacity-100 '+(pinned?.id===m.id?'!opacity-100 text-indigo-400':'')}><Pin className="h-3 w-3" strokeWidth={1.5}/></button>
                <button onClick={()=>toTask(m)} title="Jadikan tugas" className="opacity-60 hover:opacity-100"><BellPlus className="h-3 w-3" strokeWidth={1.5}/></button>
              </div>
            </div>
          </div>
        ))}
        {teamPolls.map(p=>{
          const totalVotes = Object.keys(p.votes||{}).length
          return (
            <div key={p.id} className="card max-w-[85%] p-4 mx-auto w-full">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700"><Vote className="h-3 w-3" strokeWidth={1.5}/>Voting</span>
                {p.closed && <span className="rounded-full bg-subtle px-2.5 py-0.5 text-[10px] font-medium text-inksoft">Ditutup</span>}
                <span className="text-[11px] text-dim ml-auto">{p.by}</span>
              </div>
              <b className="text-[14px] block mt-2 text-ink dark:text-white">{p.q}</b>
              <div className="mt-2.5 space-y-1.5">
                {p.options.map((o,i)=>{
                  const count = Object.values(p.votes||{}).filter(v=>v===i).length
                  const pc = totalVotes ? Math.round(count/totalVotes*100) : 0
                  const mine = p.votes?.[user.id]===i
                  return (
                    <button key={i} disabled={p.closed} onClick={()=>votePoll(p.id,i)}
                      className={'relative w-full text-left rounded-xl border px-3.5 py-2 text-[13px] font-semibold overflow-hidden transition '+
                        (mine?'border-indigo-400 bg-indigo-50/50':'border-line hover:border-zinc-400 disabled:opacity-60')}>
                      {totalVotes>0 && <span className="absolute inset-y-0 left-0 bg-indigo-500/10 transition-all" style={{width:pc+'%'}}/>}
                      <span className="relative flex justify-between"><span>{mine?'✓ ':''}{o}</span>{totalVotes>0 && <span className="text-inksoft font-mono">{pc}%</span>}</span>
                    </button>
                  )
                })}
              </div>
              <div className="text-[11px] text-inksoft mt-2 flex items-center">
                {totalVotes} suara
                {!p.closed && p.by===user.name && <button onClick={()=>closePoll(p.id)} className="ml-auto text-[11px] font-medium text-dim hover:text-rose-600">Tutup voting</button>}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      {replyTo && <div className="flex items-center justify-between rounded-lg border border-line bg-canvas px-4 py-1.5 text-[11px] mb-2">
        <span className="truncate text-inksoft">Membalas <b>{replyTo.name}</b>: {replyTo.text}</span>
        <button onClick={()=>setReplyTo(null)} className="text-dim hover:text-ink">✕</button>
      </div>}

      <form onSubmit={send} className="card p-3">
        {pollMode ? (
          <div className="p-2 space-y-2">
            <input value={pollQ} onChange={e=>setPollQ(e.target.value)} placeholder="Pertanyaan voting…" className="field !text-sm font-semibold"/>
            {pollOpts.map((o,i)=>(
              <input key={i} value={o} onChange={e=>setPollOpts(pollOpts.map((x,j)=>j===i?e.target.value:x))} placeholder={'Pilihan '+(i+1)} className="field"/>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={()=>setPollOpts([...pollOpts,''])} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-inksoft hover:bg-subtle">+ Pilihan</button>
              <button type="submit" className="btn-dark">Buat voting</button>
              <button type="button" onClick={()=>setPollMode(false)} className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-dim hover:text-ink">Batal</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button type="button" onClick={()=>setPollMode(true)} title="Buat voting" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line text-inksoft hover:border-indigo-400"><Vote className="h-4 w-4" strokeWidth={1.5}/></button>
            <label title="Kirim file" className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-line text-inksoft hover:border-indigo-400">📎
              <input id="zk-file" type="file" className="hidden" onChange={e=>setFile(e.target.files[0])}/>
            </label>
            <input value={text} onChange={e=>setText(e.target.value)} placeholder="Tulis pesan…" className="field flex-1 !text-sm"/>
            <button type="submit" className="btn-dark shrink-0 !px-3.5 !py-2">Kirim</button>
          </div>
        )}
        {file && !pollMode && <div className="text-[11.5px] text-inksoft mt-2 px-1">Lampiran: <b className="text-ink">{file.name}</b> ({Math.round(file.size/1024)} KB)</div>}
      </form>
    </div>
  )
}
