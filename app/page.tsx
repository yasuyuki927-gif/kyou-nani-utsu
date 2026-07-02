"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type MachineKind = "パチンコ" | "スロット";

type Machine = {
  id: string;
  name: string;
  kind: MachineKind;
  type: string;
  priority: number;
  volatility: number;
  storeMemo: string;
  settingMemo: string;
  ceilingMemo: string;
  zoneMemo: string;
  quitMemo: string;
  chonboristaUrl: string;
  createdAt: string;
};

type ProfitRecord = {
  id: string;
  date: string;
  machineName: string;
  investment: number;
  payout: number;
  memo: string;
};

const MACHINES_KEY = "kyou-nani-utsu-machines-v1";
const RECORDS_KEY = "kyou-nani-utsu-records-v1";

const emptyMachine = (): Omit<Machine, "id" | "createdAt"> => ({
  name: "",
  kind: "スロット",
  type: "",
  priority: 3,
  volatility: 3,
  storeMemo: "",
  settingMemo: "",
  ceilingMemo: "",
  zoneMemo: "",
  quitMemo: "",
  chonboristaUrl: "",
});

const today = () => new Date().toISOString().slice(0, 10);

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const makeId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export default function Home() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [records, setRecords] = useState<ProfitRecord[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [machineForm, setMachineForm] = useState(emptyMachine());
  const [recordForm, setRecordForm] = useState({ date: today(), machineName: "", investment: "", payout: "", memo: "" });
  const [drawnMachine, setDrawnMachine] = useState<Machine | null>(null);
  const [notice, setNotice] = useState("機種を登録して、今日の1台を抽選しましょう。");

  useEffect(() => {
    setMachines(readStorage<Machine[]>(MACHINES_KEY, []));
    setRecords(readStorage<ProfitRecord[]>(RECORDS_KEY, []));
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) window.localStorage.setItem(MACHINES_KEY, JSON.stringify(machines));
  }, [isReady, machines]);

  useEffect(() => {
    if (isReady) window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [isReady, records]);

  const totalProfit = useMemo(() => records.reduce((sum, record) => sum + record.payout - record.investment, 0), [records]);

  const addMachine = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!machineForm.name.trim()) {
      setNotice("機種名は必須です。");
      return;
    }
    const machine: Machine = {
      ...machineForm,
      name: machineForm.name.trim(),
      type: machineForm.type.trim(),
      chonboristaUrl: machineForm.chonboristaUrl.trim(),
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    setMachines((current) => [machine, ...current]);
    setMachineForm(emptyMachine());
    setNotice("機種を登録しました。外部サイトの内容は取得せず、URLだけ保存します。");
  };

  const drawMachine = () => {
    if (machines.length === 0) {
      setNotice("先に機種を1件以上登録してください。");
      return;
    }
    const weighted = machines.flatMap((machine) => Array.from({ length: machine.priority }, () => machine));
    const result = weighted[Math.floor(Math.random() * weighted.length)];
    setDrawnMachine(result);
    setRecordForm((current) => ({ ...current, machineName: result.name }));
    setNotice("抽選しました。優先度が高い機種ほど選ばれやすくなっています。");
  };

  const addRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const record: ProfitRecord = {
      id: makeId(),
      date: recordForm.date || today(),
      machineName: recordForm.machineName.trim() || drawnMachine?.name || "未選択",
      investment: Number(recordForm.investment || 0),
      payout: Number(recordForm.payout || 0),
      memo: recordForm.memo.trim(),
    };
    setRecords((current) => [record, ...current]);
    setRecordForm({ date: today(), machineName: drawnMachine?.name ?? "", investment: "", payout: "", memo: "" });
    setNotice("収支記録を保存しました。");
  };

  const deleteMachine = (id: string) => {
    setMachines((current) => current.filter((machine) => machine.id !== id));
    if (drawnMachine?.id === id) setDrawnMachine(null);
  };

  const deleteRecord = (id: string) => setRecords((current) => current.filter((record) => record.id !== id));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-4 py-5 safe-bottom">
      <header className="rounded-[2rem] bg-ink p-6 text-white shadow-soft">
        <p className="text-sm font-semibold text-gold">スマホ用・自分メモ専用</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">今日なに打つ？</h1>
        <p className="mt-3 text-sm leading-6 text-white/80">登録したパチンコ・パチスロ機種から、優先度つきランダムで今日の1台を抽選します。</p>
      </header>

      <section className="sticky top-3 z-10 rounded-3xl border border-white/80 bg-white/95 p-4 shadow-soft backdrop-blur">
        <button onClick={drawMachine} className="w-full rounded-2xl bg-brand px-5 py-4 text-lg font-black text-white shadow-lg shadow-brand/30 active:scale-[0.99]">今日の1台を抽選</button>
        <p className="mt-3 text-center text-xs text-slate-500">{notice}</p>
      </section>

      {drawnMachine && <ResultCard machine={drawnMachine} />}

      <section className="rounded-[2rem] bg-white p-5 shadow-soft">
        <SectionTitle title="機種登録" subtitle="解析ページはURLだけ保存。本文・表・画像・数値はコピーしません。" />
        <form onSubmit={addMachine} className="mt-4 grid gap-3">
          <TextInput label="機種名" value={machineForm.name} onChange={(value) => setMachineForm({ ...machineForm, name: value })} required />
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm font-bold">種別<select className="input" value={machineForm.kind} onChange={(e) => setMachineForm({ ...machineForm, kind: e.target.value as MachineKind })}><option>スロット</option><option>パチンコ</option></select></label>
            <TextInput label="タイプ" value={machineForm.type} onChange={(value) => setMachineForm({ ...machineForm, type: value })} placeholder="AT / A+ART / ミドル等" />
          </div>
          <RangeInput label="優先度" value={machineForm.priority} onChange={(value) => setMachineForm({ ...machineForm, priority: value })} />
          <RangeInput label="荒さ" value={machineForm.volatility} onChange={(value) => setMachineForm({ ...machineForm, volatility: value })} />
          <TextArea label="店舗メモ" value={machineForm.storeMemo} onChange={(value) => setMachineForm({ ...machineForm, storeMemo: value })} />
          <TextArea label="設定示唆メモ" value={machineForm.settingMemo} onChange={(value) => setMachineForm({ ...machineForm, settingMemo: value })} />
          <TextArea label="天井メモ" value={machineForm.ceilingMemo} onChange={(value) => setMachineForm({ ...machineForm, ceilingMemo: value })} />
          <TextArea label="ゾーンメモ" value={machineForm.zoneMemo} onChange={(value) => setMachineForm({ ...machineForm, zoneMemo: value })} />
          <TextArea label="やめどきメモ" value={machineForm.quitMemo} onChange={(value) => setMachineForm({ ...machineForm, quitMemo: value })} />
          <TextInput label="ちょんぼりすたURL" value={machineForm.chonboristaUrl} onChange={(value) => setMachineForm({ ...machineForm, chonboristaUrl: value })} placeholder="https://chonborista.com/..." type="url" />
          <button className="rounded-2xl bg-ink px-4 py-3 font-black text-white">機種を保存</button>
        </form>
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-soft">
        <SectionTitle title="収支記録" subtitle={`合計収支 ${totalProfit.toLocaleString()}円`} />
        <form onSubmit={addRecord} className="mt-4 grid gap-3">
          <TextInput label="日付" value={recordForm.date} onChange={(value) => setRecordForm({ ...recordForm, date: value })} type="date" />
          <TextInput label="機種名" value={recordForm.machineName} onChange={(value) => setRecordForm({ ...recordForm, machineName: value })} />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="投資" value={recordForm.investment} onChange={(value) => setRecordForm({ ...recordForm, investment: value })} type="number" />
            <TextInput label="回収" value={recordForm.payout} onChange={(value) => setRecordForm({ ...recordForm, payout: value })} type="number" />
          </div>
          <TextArea label="実戦メモ" value={recordForm.memo} onChange={(value) => setRecordForm({ ...recordForm, memo: value })} />
          <button className="rounded-2xl bg-gold px-4 py-3 font-black text-ink">収支を保存</button>
        </form>
        <div className="mt-5 grid gap-3">
          {records.map((record) => (
            <article key={record.id} className="rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex items-start justify-between gap-3"><div><p className="font-black">{record.date} {record.machineName}</p><p className={(record.payout - record.investment) >= 0 ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>{(record.payout - record.investment).toLocaleString()}円</p></div><button onClick={() => deleteRecord(record.id)} className="text-xs text-slate-400">削除</button></div>
              {record.memo && <p className="mt-2 whitespace-pre-wrap text-slate-600">{record.memo}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-soft">
        <SectionTitle title="登録済み機種" subtitle={`${machines.length}件`} />
        <div className="mt-4 grid gap-3">
          {machines.map((machine) => (
            <article key={machine.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{machine.name}</h3><p className="text-xs text-slate-500">{machine.kind} / {machine.type || "タイプ未入力"} / 優先度{machine.priority} / 荒さ{machine.volatility}</p></div><button onClick={() => deleteMachine(machine.id)} className="text-xs text-slate-400">削除</button></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ResultCard({ machine }: { machine: Machine }) {
  const memos = [
    ["店舗", machine.storeMemo],
    ["設定示唆", machine.settingMemo],
    ["天井", machine.ceilingMemo],
    ["ゾーン", machine.zoneMemo],
    ["やめどき", machine.quitMemo],
  ].filter(([, value]) => value);

  return (
    <section className="rounded-[2rem] bg-gradient-to-br from-brand to-orange-400 p-1 shadow-soft">
      <div className="rounded-[1.8rem] bg-white p-5">
        <p className="text-sm font-black text-brand">抽選結果</p>
        <h2 className="mt-1 text-3xl font-black">{machine.name}</h2>
        <p className="mt-2 text-sm text-slate-500">{machine.kind} / {machine.type || "タイプ未入力"} / 優先度{machine.priority} / 荒さ{machine.volatility}</p>
        <div className="mt-4 grid gap-2">
          {memos.length === 0 && <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">自分用メモは未入力です。</p>}
          {memos.map(([label, value]) => <p key={label} className="rounded-2xl bg-slate-50 p-3 text-sm"><span className="font-black">{label}：</span><span className="whitespace-pre-wrap text-slate-700">{value}</span></p>)}
        </div>
        {machine.chonboristaUrl ? <a href={machine.chonboristaUrl} target="_blank" rel="noreferrer" className="mt-4 block rounded-2xl bg-ink px-4 py-3 text-center font-black text-white">ちょんぼりすたで確認</a> : <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-center text-sm font-bold text-amber-700">ちょんぼりすたURL未登録</p>}
      </div>
    </section>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div><h2 className="text-2xl font-black">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</p></div>;
}

function TextInput({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="grid gap-1 text-sm font-bold">{label}<input className="input" value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} required={required} /></label>;
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-sm font-bold">{label}<textarea className="input min-h-20 resize-y" value={value} onChange={(e) => onChange(e.target.value)} placeholder="自分用に手入力" /></label>;
}

function RangeInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="grid gap-2 text-sm font-bold"><span className="flex justify-between"><span>{label}</span><span>{value}</span></span><input value={value} onChange={(e) => onChange(Number(e.target.value))} type="range" min="1" max="5" className="accent-brand" /></label>;
}
