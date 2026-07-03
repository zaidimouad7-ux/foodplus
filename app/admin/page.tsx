"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// CONNEXION DIRECTE À SUPABASE
const supabaseUrl = "https://kzubxrbuuiersdxwmoyj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6dWJ4cmJ1dWllcnNkeHdtb3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjc4MDAsImV4cCI6MjA5NzgwMzgwMH0.BImuZKbk-p77HMqHmChndnK1SPslpcfNJBqYa5AWFYg";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardAdmin() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  
  // 💡 NOUVEAU : On a séparé les commandes actives et terminées
  const [ongletActif, setOngletActif] = useState<'actives' | 'terminees' | 'menu' | 'stocks'>('actives');

  // Formulaire Nouveau Produit
  const [pNom, setPNom] = useState("");
  const [pPrix, setPPrix] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pImageFile, setPImageFile] = useState<File | null>(null);
  const [envoiFichier, setEnvoiFichier] = useState(false);

  // Formulaire Nouvel Ingrédient
  const [iNom, setINom] = useState("");
  const [iQuantite, setIQuantite] = useState("");
  const [iUnite, setIUnite] = useState("kg");

  const chargerDonnees = async () => {
    try {
      const { data: restoData } = await supabase.from('restaurants').select('id').limit(1).single();
      if (restoData) setRestaurantId(restoData.id);

      const { data: cmdData } = await supabase.from('commandes').select('*').order('id', { ascending: false });
      setCommandes(cmdData || []);

      const { data: prodData } = await supabase.from('produits').select('*').order('nom');
      setProduits(prodData || []);

      const { data: ingData } = await supabase.from('ingredients').select('*').order('nom');
      setIngredients(ingData || []);
    } catch (error: any) {
      console.error("Erreur de chargement :", error.message);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  // --- ACTIONS DU MENU ---
  const ajouterProduit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pNom || !pPrix || !restaurantId) return;
    setEnvoiFichier(true);
    let finalImageUrl = "";
    try {
      if (pImageFile) {
        const extension = pImageFile.name.split('.').pop();
        const nomUniqueFichier = `${Math.random()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('produits-images').upload(nomUniqueFichier, pImageFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('produits-images').getPublicUrl(nomUniqueFichier);
        finalImageUrl = data.publicUrl;
      }
      const { error } = await supabase.from('produits').insert([{ 
        nom: pNom, prix: Number(pPrix), description: pDesc, restaurant_id: restaurantId, disponible: true, image_url: finalImageUrl 
      }]);
      if (error) throw error;
      setPNom(""); setPPrix(""); setPDesc(""); setPImageFile(null);
      chargerDonnees();
    } catch (error: any) { alert(error.message); } finally { setEnvoiFichier(false); }
  };

  const supprimerProduit = async (id: string) => {
    if (confirm("Supprimer ce plat de la carte ?")) {
      await supabase.from('produits').delete().eq('id', id);
      chargerDonnees();
    }
  };

  // --- ACTIONS COMMANDES ---
  const marquerCommeLivree = async (id: string) => {
    await supabase.from('commandes').update({ statut: 'Livrée ✅' }).eq('id', id);
    chargerDonnees();
  };

  // --- ACTIONS STOCKS ---
  const ajouterIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('ingredients').insert([{ nom: iNom, quantite: Number(iQuantite), unite: iUnite }]);
    setINom(""); setIQuantite(""); chargerDonnees();
  };

  const modifierStock = async (id: string, actuelle: number) => {
    const nvelle = prompt("Nouvelle quantité en stock :", actuelle.toString());
    if (nvelle !== null) {
      await supabase.from('ingredients').update({ quantite: Number(nvelle) }).eq('id', id);
      chargerDonnees();
    }
  };

  if (chargement) return <div className="min-h-screen flex items-center justify-center bg-[#0f4d22] text-yellow-400 font-black text-3xl animate-pulse italic uppercase tracking-widest">Ouverture du QG...</div>;

  // 💡 NOUVEAU : Filtre dynamique pour l'affichage des commandes
  const commandesAffichees = ongletActif === 'actives' 
    ? commandes.filter(c => c.statut !== 'Livrée ✅') 
    : commandes.filter(c => c.statut === 'Livrée ✅');

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans pb-20">
      
      {/* NAV MANAGER */}
      <nav className="bg-[#0f4d22] text-white p-6 shadow-xl flex justify-between items-center border-b-8 border-yellow-400">
        <div className="flex items-center gap-4">
          <img src="/logo.jpg" alt="Logo" className="w-14 h-14 rounded-full border-2 border-white object-cover" />
          <h1 className="text-2xl font-black uppercase tracking-tighter italic">Tableau de bord <span className="text-yellow-400">Manager</span></h1>
        </div>
        <div className="flex items-center gap-3 bg-[#1a6e34] px-5 py-2.5 rounded-full border border-green-600 shadow-inner">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></div>
          <span className="text-sm font-black uppercase tracking-widest text-green-100">En Ligne</span>
        </div>
      </nav>

      {/* TABS (NOUVEAU DESIGN) */}
      <div className="bg-white shadow-md sticky top-0 z-10 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto flex">
          {[
            { id: 'actives', label: '⏳ Nouvelles Commandes', count: commandes.filter(c => c.statut !== 'Livrée ✅').length },
            { id: 'terminees', label: '✅ Historique (Livrées)', count: commandes.filter(c => c.statut === 'Livrée ✅').length },
            { id: 'menu', label: '📜 Gérer la Carte', count: produits.length },
            { id: 'stocks', label: '🧀 Inventaire', count: ingredients.length }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setOngletActif(tab.id as any)}
              className={`px-6 md:px-8 py-5 font-black uppercase italic text-xs md:text-sm tracking-widest transition-all border-b-4 flex items-center gap-3 whitespace-nowrap ${
                ongletActif === tab.id ? 'border-[#0f4d22] text-[#0f4d22] bg-green-50/50' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`text-[11px] px-2.5 py-0.5 rounded-md ${ongletActif === tab.id ? 'bg-[#0f4d22] text-yellow-400' : 'bg-gray-200 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <main className="p-4 md:p-8 max-w-7xl mx-auto mt-4">
        
        {/* --- SECTION DES COMMANDES (ACTIVES OU TERMINÉES) --- */}
        {['actives', 'terminees'].includes(ongletActif) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {commandesAffichees.length === 0 ? (
              <p className="col-span-full text-center text-gray-400 font-bold text-xl py-10">
                {ongletActif === 'actives' ? "C'est calme... Aucune commande en attente." : "Aucune commande dans l'historique."}
              </p>
            ) : (
              commandesAffichees.map((cmd) => (
                <div key={cmd.id} className={`bg-white rounded-3xl shadow-sm border-2 overflow-hidden transition-all ${cmd.statut === 'Livrée ✅' ? 'border-gray-200 opacity-70' : 'border-[#0f4d22] hover:shadow-xl'}`}>
                  
                  {/* En-tête de la carte */}
                  <div className={`p-4 border-b flex justify-between items-center ${cmd.statut === 'Livrée ✅' ? 'bg-gray-100' : 'bg-[#0f4d22] text-white'}`}>
                    <span className="font-black italic text-sm tracking-wider">#CMD-{String(cmd.id).padStart(4, '0')}</span>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-md uppercase italic ${cmd.statut === 'Livrée ✅' ? 'bg-gray-300 text-gray-600' : 'bg-yellow-400 text-[#0f4d22]'}`}>
                      {cmd.statut}
                    </span>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Infos Client */}
                    <div>
                      <h3 className="font-black text-xl uppercase italic text-gray-800">{cmd.nom_client}</h3>
                      <p className="text-gray-500 font-bold text-sm mt-1">📱 {cmd.telephone_client}</p>
                    </div>

                    {/* 💡 NOUVEAU : Adresse réparée ! */}
                    <p className="text-gray-600 text-sm font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">
                      📍 {cmd.adresse_livraison || "Adresse non renseignée"}
                    </p>

                    {/* 💡 NOUVEAU : Contenu de la commande */}
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                      <p className="text-xs font-black text-orange-800 uppercase tracking-widest mb-2 border-b border-orange-200 pb-1">Détail des plats :</p>
                      <p className="text-sm font-bold text-gray-800">
                        {cmd.details ? cmd.details.split(' | ').map((ligne: string, i: number) => (
                          <span key={i} className="block mb-1">🍕 {ligne}</span>
                        )) : "Détails non enregistrés"}
                      </p>
                    </div>
                    
                    {/* 💡 NOUVEAU : Affichage de la note du client (s'il y en a une) */}
                    {cmd.notes_client && (
                      <div className="bg-yellow-100 p-4 rounded-xl border-2 border-yellow-300 mt-3">
                        <p className="text-xs font-black text-yellow-800 uppercase tracking-widest mb-1">✍️ Note du client :</p>
                        <p className="text-sm font-bold text-gray-900 italic">"{cmd.notes_client}"</p>
                      </div>
                    )}
                    
                    {/* Prix Total */}
                    <div className="pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                      <span className="text-3xl font-black text-orange-600 italic tracking-tighter">{cmd.total} DA</span>
                    </div>
                    
                    {/* Bouton de validation (Uniquement si active) */}
                    {cmd.statut !== 'Livrée ✅' && (
                      <button 
                        onClick={() => marquerCommeLivree(cmd.id)}
                        className="w-full mt-4 bg-[#0f4d22] hover:bg-[#1a6e34] text-white font-black py-4 rounded-2xl transition-all shadow-md active:scale-95 uppercase text-sm tracking-widest flex items-center justify-center gap-2"
                      >
                        🛵 Marquer comme livrée
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- MENU --- */}
        {ongletActif === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-4xl shadow-lg border-4 border-yellow-400 h-fit">
              <h2 className="font-black text-2xl uppercase italic mb-6 text-[#0f4d22] tracking-tighter">Nouveau Plat</h2>
              <form onSubmit={ajouterProduit} className="space-y-4">
                <input type="text" placeholder="NOM DU PLAT" value={pNom} onChange={(e)=>setPNom(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-[#0f4d22] outline-none font-black text-sm uppercase text-gray-800" />
                <input type="number" placeholder="PRIX (DA)" value={pPrix} onChange={(e)=>setPPrix(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-[#0f4d22] outline-none font-black text-sm text-gray-800" />
                <textarea placeholder="DESCRIPTION ET INGRÉDIENTS" value={pDesc} onChange={(e)=>setPDesc(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-[#0f4d22] outline-none font-bold text-sm h-28 resize-none text-gray-800" />
                <div className="bg-green-50 p-4 rounded-2xl border-2 border-dashed border-green-200">
                  <p className="text-xs font-bold text-green-800 mb-2 uppercase tracking-widest">Image du plat</p>
                  <input type="file" accept="image/*" onChange={(e)=>setPImageFile(e.target.files![0])} className="text-xs font-black text-[#0f4d22] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#0f4d22] file:text-yellow-400 cursor-pointer" />
                </div>
                <button type="submit" disabled={envoiFichier} className="w-full bg-yellow-400 hover:bg-yellow-500 text-[#0f4d22] font-black py-4 rounded-2xl shadow-md transition-all uppercase italic tracking-tighter text-lg">
                  {envoiFichier ? 'CHARGEMENT...' : '➕ AJOUTER À LA CARTE'}
                </button>
              </form>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {produits.map((p)=>(
                <div key={p.id} className="bg-white p-5 rounded-3xl shadow-sm border-2 border-gray-100 flex items-center gap-6 group hover:border-[#0f4d22] transition-all">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-50 shrink-0">
                    {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🍕</div>}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black uppercase italic text-gray-800 text-lg tracking-tight mb-1">{p.nom}</h3>
                    <p className="text-gray-400 text-xs font-medium line-clamp-1 mb-2">{p.description}</p>
                    <p className="text-orange-600 font-black italic tracking-tighter text-xl">{p.prix} DA</p>
                  </div>
                  <button onClick={()=>supprimerProduit(p.id)} className="w-12 h-12 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-colors bg-red-50 text-xl">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- STOCKS --- */}
        {ongletActif === 'stocks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="bg-white p-8 rounded-4xl shadow-lg border-4 border-[#0f4d22] h-fit">
              <h2 className="font-black text-2xl uppercase italic mb-6 text-[#0f4d22] tracking-tighter">Nouvel Ingrédient</h2>
              <form onSubmit={ajouterIngredient} className="space-y-4">
                <input type="text" placeholder="NOM (ex: Mozzarella)" value={iNom} onChange={(e)=>setINom(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-[#0f4d22] outline-none font-black text-sm uppercase text-gray-800" />
                <div className="flex gap-3">
                  <input type="number" placeholder="QTÉ" value={iQuantite} onChange={(e)=>setIQuantite(e.target.value)} className="flex-1 p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-[#0f4d22] outline-none font-black text-sm text-gray-800" />
                  <select value={iUnite} onChange={(e)=>setIUnite(e.target.value)} className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-[#0f4d22] outline-none font-black text-sm text-gray-800 cursor-pointer">
                    <option value="kg">KG</option><option value="g">G</option><option value="L">L</option><option value="unités">UNITÉS</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-[#0f4d22] hover:bg-[#1a6e34] text-yellow-400 font-black py-4 rounded-2xl shadow-md transition-all uppercase italic tracking-tighter text-lg">💾 ENREGISTRER</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-white rounded-4xl shadow-sm border-2 border-gray-100 overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-[#0f4d22] text-white">
                   <tr className="text-xs font-black uppercase tracking-widest">
                     <th className="p-6 italic">Ingrédient</th>
                     <th className="p-6 italic text-center">En Stock</th>
                     <th className="p-6 italic text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {ingredients.map((ing)=>(
                     <tr key={ing.id} className="hover:bg-green-50/50 transition-colors">
                       <td className="p-6 font-black uppercase italic text-sm text-gray-700">{ing.nom}</td>
                       <td className="p-6 text-center">
                         <span className={`font-black text-sm italic ${ing.quantite < 5 ? 'text-red-600 bg-red-100 border-red-200' : 'text-[#0f4d22] bg-green-100 border-green-200'} px-4 py-1.5 rounded-lg border-2`}>
                           {ing.quantite} {ing.unite}
                         </span>
                       </td>
                       <td className="p-6 text-right">
                         <button onClick={()=>modifierStock(ing.id, ing.quantite)} className="text-xs font-black text-yellow-600 bg-yellow-100 hover:bg-yellow-400 hover:text-[#0f4d22] px-4 py-2 rounded-xl uppercase italic transition-colors">Ajuster</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}