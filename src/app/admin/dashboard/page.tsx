
"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "@/lib/supabase";

type Home={
  id:string;
  title:string;
  price:number;
  location:string;
  property_type:string;
  bedrooms:number|null;
  bathrooms:number|null;
  tenure:string|null;
  image_url:string|null;
  description:string|null;
  status:string;
};

const blank={
  title:"",
  price:"",
  location:"",
  property_type:"Teres",
  bedrooms:"3",
  bathrooms:"2",
  tenure:"",
  image_url:"",
  description:"",
  status:"available"
};

export default function dashboard(){
  const [homes,setHomes]=useState<Home[]>([]);
  const [form,setForm]=useState(blank);
  const [editing,setEditing]=useState<string|null>(null);
  const [leads,setLeads]=useState<any[]>([]);
  const [error,setError]=useState("");
  const [ready,setReady]=useState(false);

  const [settings,setSettings]=useState({
    dsr:"60",
    annual_rate:"4.2",
    years:"35",
    margin:"90",
    ot_percent:"80"
  });

  const [settingsSaving,setSettingsSaving]=useState(false);

  const router=useRouter();

  async function load(){
    if(!supabase)return;

    const {data,error}=await supabase
      .from("homes")
      .select("*")
      .order("created_at",{ascending:false});

    if(error)setError(error.message);
    else setHomes(data||[]);

    const l=await supabase
      .from("leads")
      .select("id,name,phone,estimated_budget,created_at")
      .order("created_at",{ascending:false})
      .limit(100);

    if(!l.error)setLeads(l.data||[]);

    const s=await supabase
      .from("app_settings")
      .select("dsr,annual_rate,years,margin,ot_percent")
      .eq("id",1)
      .single();

    if(s.error){
      setError("Gagal membaca tetapan: "+s.error.message);
    }else if(s.data){
      setSettings({
        dsr:String(s.data.dsr),
        annual_rate:String(s.data.annual_rate),
        years:String(s.data.years),
        margin:String(s.data.margin),
        ot_percent:String(s.data.ot_percent)
      });
    }
  }

  useEffect(()=>{
    (async()=>{
      if(!supabase){
        setError("Supabase belum dikonfigurasi.");
        return;
      }

      const {data}=await supabase.auth.getSession();

      if(!data.session){
        router.replace("/admin");
        return;
      }

      const role=data.session.user.app_metadata?.role;

      if(role!=="admin"){
        setError("Akaun ini belum diberikan peranan admin. Tetapkan app_metadata role=admin.");
        return;
      }

      await load();
      setReady(true);
    })();
  },[]);

  async function save(e:React.FormEvent){
    e.preventDefault();
    if(!supabase)return;

    const payload={
      ...form,
      price:Number(form.price),
      bedrooms:Number(form.bedrooms)||null,
      bathrooms:Number(form.bathrooms)||null
    };

    const q=editing
      ?supabase.from("homes").update(payload).eq("id",editing)
      :supabase.from("homes").insert(payload);

    const {error}=await q;

    if(error)setError(error.message);
    else{
      setForm(blank);
      setEditing(null);
      setError("");
      await load();
    }
  }

  async function remove(id:string){
    if(!supabase||!confirm("Padam unit rumah ini?"))return;

    const {error}=await supabase.from("homes").delete().eq("id",id);

    if(error)setError(error.message);
    else load();
  }

  function edit(h:Home){
    setEditing(h.id);
    setForm({
      title:h.title,
      price:String(h.price),
      location:h.location,
      property_type:h.property_type,
      bedrooms:String(h.bedrooms||""),
      bathrooms:String(h.bathrooms||""),
      tenure:h.tenure||"",
      image_url:h.image_url||"",
      description:h.description||"",
      status:h.status
    });
  }

  async function logout(){
    await supabase?.auth.signOut();
    router.push("/admin");
  }

  async function saveSettings(e:React.FormEvent){
    e.preventDefault();
    if(!supabase)return;

    const values={
      dsr:Number(settings.dsr),
      annual_rate:Number(settings.annual_rate),
      years:Number(settings.years),
      margin:Number(settings.margin),
      ot_percent:Number(settings.ot_percent)
    };

    if(
      !Object.values(values).every(Number.isFinite)||
      values.dsr<=0||values.dsr>100||
      values.annual_rate<0||
      values.years<=0||values.years>40||
      values.margin<=0||values.margin>100||
      values.ot_percent<0||values.ot_percent>100
    ){
      alert("Sila semak nilai tetapan. Ada nilai yang tidak sah.");
      return;
    }

    setSettingsSaving(true);

    const {error}=await supabase
      .from("app_settings")
      .update({...values,updated_at:new Date().toISOString()})
      .eq("id",1);

    setSettingsSaving(false);

    if(error){
      alert("Gagal menyimpan tetapan: "+error.message);
      return;
    }

    alert("Tetapan pengiraan berjaya disimpan!");
  }

  return (
    <main className="wrap">
      <nav className="nav">
        <a className="brand" href="/">
          RUMAHKU <span>CHECK</span> / ADMIN
        </a>
        <button className="btn secondary" onClick={logout}>
          Log keluar
        </button>
      </nav>

      <h1>Admin Dashboard</h1>

      <p className="muted">
        Urus inventori hartanah dan lihat prospek yang memberi persetujuan.
      </p>

      {error&&<p style={{color:"#a83d36"}}>{error}</p>}

      {!ready?
        <div className="panel">Memeriksa akses admin...</div>
      :
      <>
        <div className="grid">
          <section className="panel">
            <h2>{editing?"Kemaskini unit rumah":"Tambah unit rumah"}</h2>

            <form onSubmit={save}>
              {Object.entries({
                title:"Nama / tajuk rumah",
                price:"Harga (RM)",
                location:"Lokasi",
                property_type:"Jenis hartanah",
                bedrooms:"Bilangan bilik",
                bathrooms:"Bilangan bilik air",
                tenure:"Pegangan",
                image_url:"URL gambar (https://...)",
                description:"Penerangan"
              }).map(([key,label])=>(
                <div className="field" key={key}>
                  <label>{label}</label>
                  <input
                    required={["title","price","location","property_type"].includes(key)}
                    type={key==="price"||key==="bedrooms"||key==="bathrooms"?"number":"text"}
                    value={(form as any)[key]}
                    onChange={e=>setForm({...form,[key]:e.target.value})}
                  />
                </div>
              ))}

              <div className="field">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={e=>setForm({...form,status:e.target.value})}
                >
                  <option value="available">Available</option>
                  <option value="booking">Booking</option>
                  <option value="sold">Sold</option>
                </select>
              </div>

              <button className="btn">
                {editing?"Simpan perubahan":"Tambah unit"}
              </button>

              {editing&&
                <button
                  type="button"
                  className="btn secondary"
                  style={{marginLeft:8}}
                  onClick={()=>{setEditing(null);setForm(blank)}}
                >
                  Batal
                </button>
              }
            </form>
          </section>

          <section className="panel">
            <h2>Ringkasan</h2>
            <div className="stats">
              <div className="stat">
                <small>Jumlah unit</small>
                <strong>{homes.length}</strong>
              </div>
              <div className="stat">
                <small>Available</small>
                <strong>{homes.filter(h=>h.status==="available").length}</strong>
              </div>
              <div className="stat">
                <small>Prospek disimpan</small>
                <strong>{leads.length}</strong>
              </div>
            </div>
            <p className="muted" style={{marginTop:20}}>
              Hanya unit berstatus Available akan dipaparkan kepada pengunjung website.
            </p>
          </section>
        </div>

        <section className="panel" style={{marginTop:20}}>
          <h2>Tetapan Pengiraan Kelayakan</h2>
          <p className="muted">
            Tetapan ini dikawal oleh Admin dan digunakan dalam pengiraan pelanggan.
          </p>

          <form onSubmit={saveSettings}>
            <div className="grid">
              <div className="field">
                <label>Had DSR (%)</label>
                <input type="number" min="1" max="100" step="0.1"
                  value={settings.dsr}
                  onChange={e=>setSettings({...settings,dsr:e.target.value})}/>
              </div>

              <div className="field">
                <label>Kadar pembiayaan tahunan (%)</label>
                <input type="number" min="0" step="0.01"
                  value={settings.annual_rate}
                  onChange={e=>setSettings({...settings,annual_rate:e.target.value})}/>
              </div>

              <div className="field">
                <label>Tempoh pembiayaan (tahun)</label>
                <input type="number" min="1" max="40"
                  value={settings.years}
                  onChange={e=>setSettings({...settings,years:e.target.value})}/>
              </div>

              <div className="field">
                <label>Margin pembiayaan (%)</label>
                <input type="number" min="1" max="100" step="0.1"
                  value={settings.margin}
                  onChange={e=>setSettings({...settings,margin:e.target.value})}/>
              </div>

              <div className="field">
                <label>Pengiktirafan OT (%)</label>
                <input type="number" min="0" max="100" step="1"
                  value={settings.ot_percent}
                  onChange={e=>setSettings({...settings,ot_percent:e.target.value})}/>
                <small className="muted">
                  Peratus purata OT enam bulan yang diambil kira.
                </small>
              </div>
            </div>

            <button className="btn" disabled={settingsSaving}>
              {settingsSaving?"Menyimpan...":"Simpan Tetapan"}
            </button>
          </form>
        </section>

        <section className="panel" style={{marginTop:20}}>
          <h2>Inventori rumah</h2>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Rumah</th>
                  <th>Harga</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {homes.map(h=>(
                  <tr key={h.id}>
                    <td>{h.title}</td>
                    <td>RM {Number(h.price).toLocaleString("en-MY")}</td>
                    <td>{h.location}</td>
                    <td>{h.status}</td>
                    <td>
                      <button className="btn secondary" onClick={()=>edit(h)}>Edit</button>{" "}
                      <button className="btn danger" onClick={()=>remove(h.id)}>Padam</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel" style={{marginTop:20}}>
          <h2>Prospek client</h2>
          <p className="muted">
            Paparan ringkas prospek yang telah bersetuju menyimpan maklumat.
          </p>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Telefon</th>
                  <th>Anggaran bajet</th>
                  <th>Tarikh</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(l=>(
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td>{l.phone}</td>
                    <td>RM {Number(l.estimated_budget).toLocaleString("en-MY")}</td>
                    <td>{new Date(l.created_at).toLocaleDateString("ms-MY")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
      }
    </main>
  );
}
