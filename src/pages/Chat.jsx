import { useEffect, useRef, useState } from 'react'
import { loadDB, saveDB, currentUser } from '@/lib/db.js'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Card } from '@/components/ui/card.jsx'

const MAX_FILE = 500 * 1024 // 500 KB (localStorage mode; Supabase Storage nanti unlimited)
export default function Chat() {
  const [db, setDb] = useState(loadDB())
  const user = currentUser()
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [pollMode, setPollMode] = useState(false)
  const [pollQ, setPollQ] = useState('')
  const [pollOpts, setPollOpts] = useState(['', ''])
  const bottomRef = useRef(null)
  const teamMsgs = db.messages.filter(m=>m.teamId===user.teamId)
  const teamPolls = db.polls.filter(p=>p.teamId===user.teamId)
  const refresh = () => setDb(loadDB())

  useEffect(() => {
    const t = setInterval(refresh, 3000) // polling sederhana; Supabase realtime nanti
    return () => clearInterval(t)
  }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [db])

  const send = e => {
    e.preventDefault()
    if (pollMode) {
      const opts = pollOpts.filter(o=>o.trim())
      if (!pollQ.trim() || opts.length<2) return
      const next = {...db, polls:[...db.polls, {id:'p'+Date.now(), teamId:user.teamId, q:pollQ, options:opts, votes:{}, by:user.name, closed:false}]}
      saveDB(next); refresh(); setPollQ(''); setPollOpts(['','']); setPollMode(false)
      return
    }
    if (!text.trim() && !file) return
    const msg = {id:'m'+Date.now(), teamId:user.teamId, userId:user.id, name:user.name, text:text.trim(), file:null, at:new Date().toISOString()}
    if (file) {
      if (file.size > MAX_FILE) { alert('File maksimal 500 KB (mode demo). Supabase Storage menyusul untuk file besar.') ; return }
      const reader = new FileReader()
      reader.onload = () => {
        const next = {...db, messages:[...db.messages, {...msg, file:{name:file.name, type:file.type, data:reader.result}}]}
        saveDB(next); refresh()
      }
      reader.readAsDataURL(file)
    } else {
      const next = {...db, messages:[...db.messages, msg]}
      saveDB(next); refresh()
    }
    setText(''); setFile(null); setFile && (document.getElementById('zk-file').value = '')
  }
  const vote = (pollId, optIdx) => {
    const next = {...db, polls:db.polls.map(p=>p.id===pollId ? {...p, votes:{...p.votes, [user.id]:optIdx}} : p)}
    saveDB(next); refresh()
  }
  const closePoll = pollId => { const next={...db, polls:db.polls.map(p=>p.id===pollId?{...p,closed:true}:p)}; saveDB(next); refresh() }
  const time = iso => new Date(iso).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})

  return (
    <div className="p-4 md:p-7 max-w-3xl mx-auto pb-6">
      <h1 className="font-disp text-lg md:text-xl font-extrabold mb-5">💬 Chat Tim</h1>
      <Card className="p-4 h-[55vh] overflow-y-auto mb-3 space-y-3">
        {teamMsgs.length===0 && teamPolls.length===0 && <p className="text-inksoft text-[13px] text-center py-10">Belum ada pesan. Mulai percakapan! 👋</p>}
        {teamMsgs.map(m=>(
          <div key={m.id} className={'flex flex-col '+(m.userId===user.id?'items-end':'items-start')}>
            {m.userId!==user.id && <span className="text-[11px] font-bold text-inksoft mb-0.5">{m.name}</span>}
            <div className={'max-w-[80%] rounded-2xl px-4 py-2.5 text-[13.5px] '+(m.userId===user.id?'bg-blue text-white rounded-br-md':'bg-card2/60 border border-line rounded-bl-md')}>
              {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
              {m.file && <a href={m.file.data} download={m.file.name} className={'mt-1.5 flex items-center gap-2 rounded-xl px-3 py-2 font-semibold text-[12.5px] '+(m.userId===user.id?'bg-white/15 underline':'bg-white border border-line text-blue-dark')}>
                📎 {m.file.name} <span className="opacity-70">({Math.round((m.file.data.length*0.75)/1024)} KB)</span>
              </a>}
              <div className={'text-[10px] mt-1 '+(m.userId===user.id?'text-white/60':'text-inksoft')}>{time(m.at)}</div>
            </div>
          </div>
        ))}
        {teamPolls.map(p=>{
          const totalVotes = Object.keys(p.votes).length
          return (
            <Card key={p.id} className="max-w-[85%] p-4 mx-auto w-full">
              <div className="flex items-center gap-2">
                <Badge variant="violet">🗳️ Voting</Badge>
                {p.closed && <Badge variant="secondary">Ditutup</Badge>}
                <span className="text-[11px] text-inksoft ml-auto">{p.by}</span>
              </div>
              <b className="text-[14px] block mt-2">{p.q}</b>
              <div className="mt-2.5 space-y-1.5">
                {p.options.map((o,i)=>{
                  const count = Object.values(p.votes).filter(v=>v===i).length
                  const pct = totalVotes ? Math.round(count/totalVotes*100) : 0
                  const mine = p.votes[user.id]===i
                  return (
                    <button key={i} disabled={p.closed} onClick={()=>vote(p.id,i)}
                      className={'relative w-full text-left rounded-xl border px-3.5 py-2 text-[13px] font-semibold overflow-hidden transition '+
                        (mine?'border-blue bg-blue-soft':'border-line hover:border-blue/50 disabled:opacity-60')}>
                      {totalVotes>0 && <span className="absolute inset-y-0 left-0 bg-blue/10 transition-all" style={{width:pct+'%'}}/>}
                      <span className="relative flex justify-between"><span>{mine?'✓ ':''}{o}</span>{totalVotes>0 && <span className="text-inksoft">{pct}%</span>}</span>
                    </button>
                  )
                })}
              </div>
              <div className="text-[11px] text-inksoft mt-2 flex items-center">
                {totalVotes} suara
                {!p.closed && p.by===user.name && <Button onClick={()=>closePoll(p.id)} variant="ghost" className="ml-auto rounded-full h-6 px-2.5 text-[10px] hover:bg-red-soft hover:text-red">Tutup voting</Button>}
              </div>
            </Card>
          )
        })}
        <div ref={bottomRef}/>
      </Card>

      <form onSubmit={send} className="card p-3">
        {pollMode ? (
          <div className="p-2 space-y-2">
            <Input value={pollQ} onChange={e=>setPollQ(e.target.value)} placeholder="Pertanyaan voting…" className="font-semibold"/>
            {pollOpts.map((o,i)=>(
              <Input key={i} value={o} onChange={e=>setPollOpts(pollOpts.map((x,j)=>j===i?e.target.value:x))} placeholder={`Pilihan ${i+1}`}/>
            ))}
            <div className="flex gap-2">
              <Button type="button" onClick={()=>setPollOpts([...pollOpts,''])} variant="outline" size="sm" className="rounded-full">+ Pilihan</Button>
              <Button type="submit" size="sm">Buat voting</Button>
              <Button type="button" onClick={()=>setPollMode(false)} variant="secondary" size="sm" className="rounded-full ml-auto">Batal</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button type="button" onClick={()=>setPollMode(true)} title="Buat voting" className="w-9 h-9 rounded-xl bg-violet-soft text-violet hover:bg-violet hover:text-white p-0 shrink-0 shadow-none">🗳️</Button>
            <label title="Kirim file" className="w-9 h-9 rounded-xl bg-card2 border border-line grid place-items-center cursor-pointer shrink-0 hover:border-blue">📎
              <input id="zk-file" type="file" className="hidden" onChange={e=>setFile(e.target.files[0])}/>
            </label>
            <Input value={text} onChange={e=>setText(e.target.value)} placeholder="Tulis pesan…" className="flex-1"/>
            <Button className="shrink-0">{file ? '📎 Kirim' : 'Kirim'}</Button>
          </div>
        )}
        {file && !pollMode && <div className="text-[11.5px] text-inksoft mt-2 px-1">Lampiran: <b className="text-ink">{file.name}</b> ({Math.round(file.size/1024)} KB)</div>}
      </form>
    </div>
  )
}
