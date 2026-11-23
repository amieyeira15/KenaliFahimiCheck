"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, House, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calculate, installment, money } from "@/lib/calc";

type Home = {
  id:string; title:string; price:number; location:string; property_type:string;
  bedrooms:number|null; bathrooms:number|null; tenure:string|null;
  image_url:string|null; description:string|null; status:string;
};


useEffect(() => {
  let active = true;

  async function loadHomes() {
    if (!supabase) {
      setHomesError("Sambungan Supabase tidak tersedia.");
      setHomesLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("homes")
      .select("*");

    if (!active) return;

    if (error) {
      console.error("Gagal membaca inventori rumah:", error);
      setHomesError("Inventori rumah gagal dimuatkan: " + error.message);
      setHomesLoading(false);
      return;
    }

    const availableHomes = (data || [])
      .filter((home: any) =>
        String(home.status || "").trim().toLowerCase() === "available"
      )
      .map((home: any) => ({
        ...home,
        price: Number(home.price) || 0
      }));

    setHomes(availableHomes);
    setHomesError("");
    setHomesLoading(false);
  }

  loadHomes();

  return () => {
    active = false;
  };
}, []);

export default function HomePage(){
  const [homes,setHomes]=useState<Home[]>([]);
const [homesLoading,setHomesLoading]=useState(true);
const [homesError,setHomesError]=useState("");
const [homesLoading,setHomesLoading]=useState(true);
const [homesError,setHomesError]=useState("");
  const [connected,setConnected]=useState(false);
  const [basic,setBasic]=useState("3000"),[fixed,setFixed]=useState("500"),[variable,setVariable]=useState("300");
  const [variablePercent,setVariablePercent]=useState("50");
const [otMonths,setOtMonths]=useState(["0","0","0","0","0","0"]);
const [otPercent,setOtPercent]=useState(80);
const [settingsLoaded,setSettingsLoaded]=useState(false);
  const [car,setCar]=useState("600"),[personal,setPersonal]=useState("200"),[other,setOther]=useState("100");
  const [dsr,setDsr]=useState("60"),[rate,setRate]=useState("4.2"),[years,setYears]=useState("35"),[margin,setMargin]=useState("90");
  const [location,setLocation]=useState("Semua lokasi");
  const [name,setName]=useState(""),[phone,setPhone]=useState(""),[consent,setConsent]=useState(false),[saved,setSaved]=useState(false);
  const [showResults,setShowResults]=useState(false);
  const [settingsError,setSettingsError]=useState("");
  
useEffect(()=>{
  (async()=>{
    if(!supabase){
      setSettingsError("Sambungan sistem tidak tersedia.");
      return;
    }

    const {data,error}=await supabase
      .from("app_settings")
      .select("dsr,annual_rate,years,margin,ot_percent")
      .eq("id",1)
      .single();

    if(error || !data){
      console.error("Gagal membaca tetapan Admin:",error?.message);
      setSettingsError("Tetapan Admin gagal dimuatkan. Sila cuba lagi.");
      return;
    }

    setDsr(String(data.dsr));
    setRate(String(data.annual_rate));
    setYears(String(data.years));
    setMargin(String(data.margin));
    setOtPercent(Number(data.ot_percent));

    setSettingsLoaded(true);
    setSettingsError("");
  })();
},[]);

const otAverage=otMonths.reduce(
  (total,value)=>total+(Number(value)||0),0
)/6;


const result=useMemo(()=>calculate({
  basic:Number(basic)||0,
  fixed:Number(fixed)||0,
  variable:Number(variable)||0,
  variablePercent:Number(variablePercent),
  otAverage,
  otPercent,
  commitments:(Number(car)||0)+(Number(personal)||0)+(Number(other)||0),
  dsr:Number(dsr),
  annualRate:Number(rate),
  years:Number(years),
  margin:Number(margin)
}),[
  basic,fixed,variable,variablePercent,
  otAverage,otPercent,car,personal,other,
  dsr,rate,years,margin
]);


  const matches=homes.filter(h=>h.price<=result.maxPropertyPrice&&(location==="Semua lokasi"||h.location.toLowerCase().includes(location.toLowerCase())));
  const waNumber=process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||"60182970139";
  const wa=(home?:Home)=>`https://wa.me/${waNumber}?text=${encodeURIComponent(`Salam, saya telah membuat semakan di RumahKu Check. Anggaran bajet rumah saya ${money(result.maxPropertyPrice)}.${home?` Saya berminat dengan ${home.title} (${money(home.price)}).`:" Saya ingin berbincang tentang pilihan rumah yang sesuai."}`)}`;

  
 async function saveLead() {
  if (!supabase || !consent || !name.trim() || !phone.trim()) return;

  try {
    const { data, error } = await supabase.from("leads").insert({
      name: name.trim(),
      phone: phone.trim(),
      estimated_budget: Math.round(result.maxPropertyPrice),
      monthly_income: Math.round(result.income),
      monthly_commitments: Math.round(
        (Number(car) || 0) +
        (Number(personal) || 0) +
        (Number(other) || 0)
      ),
      consent_at: new Date().toISOString(),
      source: "RumahKu Check"
    });

    if (error) {
      console.error("Ralat simpan prospek:", error);
      alert("Gagal simpan prospek: " + error.message);
      return;
    }

    setSaved(true);
    alert("Prospek berjaya disimpan!");

  } catch (err) {
    console.error("Ralat sistem:", err);
    alert("Berlaku ralat sistem. Sila cuba lagi.");
  }
}
return <main className="wrap">
    <nav className="nav"><a className="brand" href="#"><House size={21} style={{verticalAlign:"-4px",color:"#176b4a"}}/> RUMAHKU <span>CHECK</span></a><a className="muted" href="/admin">Admin</a></nav>
    <section className="hero"><div><div className="eyebrow">Semak kemampuan. Cari rumah.</div><h1>Rumah yang sesuai, bermula dengan kemampuan anda.</h1><p>Masukkan pendapatan dan komitmen bulanan. Kami bantu anggarkan bajet pembelian dan padankan dengan unit rumah yang tersedia.</p><a className="btn" href="#semak">Mula semak <ArrowRight size={17}/></a></div><div className="hero-mark"><House size={118} strokeWidth={1.1}/></div></section>
    <section className="grid" id="semak">
      <div className="panel"><h2>1. Maklumat pendapatan</h2><p className="muted">Masukkan jumlah bulanan dalam Ringgit Malaysia.</p>
        <div className="field"><label>Gaji pokok (RM)</label><input type="number" min="0" value={basic} onChange={e=>setBasic(e.target.value)}/></div>
        <div className="row"><div className="field"><label>Elaun tetap (RM)</label><input type="number" min="0" value={fixed} onChange={e=>setFixed(e.target.value)}/></div><div className="field"><label>Elaun tidak tetap (RM)</label><input type="number" min="0" value={variable} onChange={e=>setVariable(e.target.value)}/></div></div>
<h3 style={{marginTop:24}}>OT enam bulan terdahulu</h3>
<p className="muted">
  Masukkan jumlah OT yang diterima bagi setiap bulan.
</p>

{otMonths.map((value,index)=>(
  <div className="field" key={index}>
    <label>Bulan {index+1} (RM)</label>
    <input
      type="number"
      min="0"
      value={value}
      onChange={e=>{
        const updated=[...otMonths];
        updated[index]=e.target.value;
        setOtMonths(updated);
      }}
    />
  </div>
))}

<div className="result">
  <div className="stats">
    <div className="stat">
      <small>Purata OT 6 bulan</small>
      <strong>{money(otAverage)}</strong>
    </div>
    <div className="stat">
      <small>Pengiktirafan Admin</small>
      <strong>{otPercent}%</strong>
    </div>
    <div className="stat">
      <small>OT diambil kira</small>
      <strong>{money(result.recognizedOt)}</strong>
    </div>
  </div>
</div>
<div className="field"><label>Elaun tidak tetap diambil kira</label><select value={variablePercent} onChange={e=>setVariablePercent(e.target.value)}><option value="0">0%</option><option value="50">50% (andaian)</option><option value="100">100% (andaian)</option></select></div>
        <h2 style={{marginTop:24}}>2. Komitmen bulanan</h2>
        <div className="field"><label>Ansuran kereta (RM)</label><input type="number" min="0" value={car} onChange={e=>setCar(e.target.value)}/></div>
        <div className="row"><div className="field"><label>Pinjaman peribadi (RM)</label><input type="number" min="0" value={personal} onChange={e=>setPersonal(e.target.value)}/></div><div className="field"><label>Komitmen lain (RM)</label><input type="number" min="0" value={other} onChange={e=>setOther(e.target.value)}/></div></div>
        <button
  className="btn"
  style={{width:"100%"}}
  disabled={!settingsLoaded}
  onClick={()=>setShowResults(true)}
>
  <Search size={17}/> Kira & cari rumah
</button>
      </div>
    
<div className="panel">
  <h2>3. Tetapan simulasi</h2>
  <p className="muted">
    Pengiraan menggunakan tetapan yang ditentukan oleh Admin.
  </p>

  {!settingsLoaded ? (
  <p className="muted">
    {settingsError || "Memuatkan tetapan Admin..."}
  </p>
) : (
    <>
      <div className="stats">
        <div className="stat">
          <small>Had DSR</small>
          <strong>{dsr}%</strong>
        </div>
        <div className="stat">
          <small>Kadar tahunan</small>
          <strong>{rate}%</strong>
        </div>
        <div className="stat">
          <small>Tempoh</small>
          <strong>{years} tahun</strong>
        </div>
        <div className="stat">
          <small>Margin pembiayaan</small>
          <strong>{margin}%</strong>
        </div>
      </div>

      <div className="result">
        <div className="muted">
          Anggaran harga maksimum rumah
        </div>
        <div className="big">
          {money(result.maxPropertyPrice)}
        </div>

        <div className="stats">
          <div className="stat">
            <small>Pendapatan diambil kira</small>
            <strong>{money(result.income)}</strong>
          </div>
          <div className="stat">
            <small>Komitmen bulanan</small>
            <strong>
              {money((Number(car)||0)+(Number(personal)||0)+(Number(other)||0))}
            </strong>
          </div>
          <div className="stat">
            <small>Baki ansuran simulasi</small>
            <strong>{money(result.maxInstallment)}</strong>
          </div>
          <div className="stat">
            <small>Anggaran pembiayaan</small>
            <strong>{money(result.maxFinancing)}</strong>
          </div>
        </div>
      </div>
    </>
  )}
</div>
    </section>
    {showResults&&<section className="panel" style={{marginTop:20}}><div className="adminbar"><div><h2 style={{margin:0}}>4. Rumah yang sepadan</h2><p className="muted">Berdasarkan bajet simulasi anda: {money(result.maxPropertyPrice)}</p></div><select value={location} onChange={e=>setLocation(e.target.value)}><option>Semua lokasi</option>{["Bagan Serai","Parit Buntar","Sungai Petani","Sitiawan"].map(x=><option key={x}>{x}</option>)}</select></div>
      {matches.length===0?<p className="muted">Tiada unit tersedia dalam julat bajet dan lokasi ini. Cuba lokasi lain atau hubungi ejen untuk pilihan lain.</p>:<div className="house-grid">{matches.map(h=><article className="house" key={h.id}>{h.image_url?<img src={h.image_url} alt={h.title}/>:<div style={{height:165,display:"grid",placeItems:"center",background:"#eaf2ed"}}><House size={54} color="#176b4a"/></div>}<div className="house-body"><span className="tag">{h.property_type}</span><h3>{h.title}</h3><div className="price">{money(h.price)}</div><p className="muted">{h.location} · {h.bedrooms??"-"} bilik · {h.bathrooms??"-"} bilik air · {h.tenure||"Maklumat hak milik belum diisi"}</p><p className="muted">{h.description}</p><p className="muted">Anggaran ansuran: <b>{money(installment(h.price,Number(margin),result.factor))}/bulan</b></p><a className="btn" style={{width:"100%"}} href={wa(h)} target="_blank" rel="noreferrer"><MessageCircle size={17}/> Tanya melalui WhatsApp</a></div></article>)}</div>}
      <div style={{marginTop:24,borderTop:"1px solid #e2e9e5",paddingTop:20}}><h2>Mahukan bantuan lanjut?</h2><p className="muted">Jika anda mahu kami hubungi semula, isi maklumat di bawah. Rekod hanya disimpan selepas anda memberi persetujuan.</p><div className="row"><div className="field"><label>Nama</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Nama anda"/></div><div className="field"><label>Nombor telefon</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Contoh: 01XXXXXXXX"/></div></div><label className="muted"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Saya bersetuju maklumat hubungan dan ringkasan semakan ini disimpan untuk tujuan susulan hartanah. Saya telah membaca notis privasi.</label><div style={{marginTop:12}}><button className="btn" disabled={!consent||!name.trim()||!phone.trim()||!supabase||saved} onClick={saveLead}>{saved?"Prospek berjaya disimpan":"Simpan maklumat & minta dihubungi"}</button>{!supabase&&<p className="muted">Sambungkan Supabase untuk mengaktifkan simpanan prospek. WhatsApp masih boleh digunakan.</p>}</div></div>
    </section>}
    <p className="notice"><ShieldCheck size={14} style={{verticalAlign:"-3px"}}/> Privasi: maklumat kewangan yang dimasukkan digunakan untuk pengiraan pada halaman ini dan tidak disimpan secara automatik. Jika anda memilih untuk menghantar borang prospek, ringkasan kewangan dan maklumat hubungan disimpan dengan persetujuan anda. Anggaran ini bukan tawaran pembiayaan, pra-kelulusan atau jaminan kelulusan bank. Penilaian sebenar tertakluk kepada bank, dokumen pendapatan, CCRIS/CTOS, umur, jenis pendapatan, komitmen dan polisi semasa.</p>
    <footer className="footer">© {new Date().getFullYear()} RumahKu Check. Semua hak terpelihara.</footer>
  </main>
}
