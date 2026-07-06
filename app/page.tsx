"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Connexion à Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ClientPage() {
  const [produits, setProduits] = useState<any[]>([]);
  
  // NOUVEAU : Les catégories sont maintenant stockées dans un état dynamique
  const [categories, setCategories] = useState<any[]>([]);
  const [categorieActive, setCategorieActive] = useState("");
  
  const [panier, setPanier] = useState<any[]>([]);
  const [panierOuvert, setPanierOuvert] = useState(false);
  
  const [produitOuvert, setProduitOuvert] = useState<any | null>(null);
  const [supplementsCoches, setSupplementsCoches] = useState<any[]>([]);

  const [nomClient, setNomClient] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [commandeValidee, setCommandeValidee] = useState(false);
  
  const [numeroCommande, setNumeroCommande] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchProduits();
  }, []);

  // NOUVEAU : Chargement des catégories depuis Supabase
  async function fetchCategories() {
    const { data, error } = await supabase.from("categories").select("*").order("id", { ascending: true });
    if (!error && data) {
      setCategories(data);
      if (data.length > 0) {
        setCategorieActive(data[0].nom); // On active la première catégorie par défaut
      }
    }
  }

  async function fetchProduits() {
    const { data } = await supabase.from("produits").select("*").order("id", { ascending: false });
    if (data) setProduits(data);
  }

  const ouvrirOptionsProduit = (produit: any) => {
    setProduitOuvert(produit);
    setSupplementsCoches([]);
  };

  const toggleSupplement = (supp: any) => {
    if (supplementsCoches.some(s => s.nom === supp.nom)) {
      setSupplementsCoches(supplementsCoches.filter(s => s.nom !== supp.nom));
    } else {
      setSupplementsCoches([...supplementsCoches, supp]);
    }
  };

  const ajouterAuPanierDirect = (produit: any, supps: any[]) => {
    const prixSupps = supps.reduce((total, s) => total + s.prix, 0);
    const prixTotalItem = produit.prix + prixSupps;

    const newItem = {
      idUnique: Math.random().toString(36).substring(7),
      produit_id: produit.id,
      nom: produit.titre || produit.nom,
      prixBase: produit.prix,
      prixTotal: prixTotalItem,
      supplements: supps
    };

    setPanier([...panier, newItem]);
    setProduitOuvert(null); // Ferme la fenêtre du produit
    // Le panier complet reste fermé pour laisser le client continuer ses achats !
  };

  const retirerDuPanier = (idUnique: string) => {
    setPanier(panier.filter(item => item.idUnique !== idUnique));
    if (panier.length === 1) setPanierOuvert(false);
  };

  const totalPanier = panier.reduce((total, item) => total + item.prixTotal, 0);

  const handleCommander = async (e: React.FormEvent) => {
    e.preventDefault();
    if (panier.length === 0) return alert("Votre panier est vide !");
    setEnvoiEnCours(true);

    const details = panier.map(item => {
      let desc = `- ${item.nom}`;
      if (item.supplements && item.supplements.length > 0) {
        desc += ` (Extras: ${item.supplements.map((s:any) => s.nom).join(', ')})`;
      }
      return desc;
    }).join('\n');

    const { data, error } = await supabase.from("commandes").insert([{
      nom_client: nomClient,
      telephone_client: telephone,
      adresse_livraison: adresse,
      total: totalPanier,
      details_commande: details,
      statut: "en attente"
    }]).select();

    setEnvoiEnCours(false);
    
    if (!error && data && data.length > 0) {
      setNumeroCommande(data[0].id);
      setCommandeValidee(true);
      setPanier([]);
      setNomClient(""); setTelephone(""); setAdresse("");
    } else {
      alert("Erreur : " + error?.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-32">
      
      {/* HEADER AVEC LOGO, SLOGAN ET BOUTON D'APPEL */}
      <header className="bg-zinc-950 border-b border-zinc-800 pt-8 pb-6 px-4 text-center sticky top-0 z-10 shadow-2xl flex flex-col items-center justify-center">
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Depuis 2011</p>
        
        <img 
          src="/logo.png" 
          alt="Logo Food Plus" 
          className="h-24 w-auto mb-3 object-contain"
        />
        
        <p className="text-red-500 text-lg font-bold mb-4" dir="rtl">“كل عضّة فيها حكاية”</p>

        <a href="tel:0553940214" className="bg-zinc-900 border border-zinc-800 text-white px-6 py-3 rounded-full font-bold flex items-center gap-3 hover:border-red-500 active:scale-95 transition-all shadow-lg">
          <span className="text-xl">📞</span> Reclamation!! : <span className="text-red-500 tracking-wider">0553940214</span>
        </a>
      </header>

      {/* NAVIGATION CATÉGORIES DYNAMIQUES */}
      <nav className="flex overflow-x-auto gap-3 p-4 sticky top-53.75 z-10 bg-black/80 backdrop-blur-md [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
        {categories.map(cat => (
          <button 
            key={cat.id} 
            onClick={() => setCategorieActive(cat.nom)}
            className={`shrink-0 px-6 py-3 rounded-full font-bold uppercase text-sm tracking-wider transition-all border ${
              categorieActive === cat.nom 
              ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/30" 
              : "bg-zinc-900 text-gray-400 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            {cat.nom}
          </button>
        ))}
      </nav>

      {/* LISTE PRODUITS */}
      <main className="p-4 max-w-5xl mx-auto mt-2">
        {categories.length === 0 ? (
          <p className="text-center text-gray-500 py-12">Aucune catégorie disponible. Ajoutez-en depuis le panel Admin.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {produits.filter(p => p.categorie === categorieActive).map(produit => (
              <div key={produit.id} onClick={() => ouvrirOptionsProduit(produit)} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform">
                {produit.image_url ? (
                  <img src={produit.image_url} alt={produit.titre} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-zinc-950 flex items-center justify-center text-5xl">🍔</div>
                )}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white">{produit.titre || produit.nom}</h3>
                    <span className="bg-red-600/20 text-red-500 px-3 py-1 rounded-lg font-black text-lg whitespace-nowrap ml-3 border border-red-500/20">{produit.prix} DA</span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2 mt-2">{produit.description}</p>
                  {produit.supplements && produit.supplements.length > 0 && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="bg-amber-500/20 text-amber-500 px-2 py-1 rounded text-xs font-bold uppercase tracking-widest">✨ Personnalisable</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL AJOUT AU PANIER ET SUPPLÉMENTS */}
      {produitOuvert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-zinc-900 w-full max-w-md border-t sm:border border-zinc-800 rounded-t-4xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="relative shrink-0">
              {produitOuvert.image_url && <img src={produitOuvert.image_url} alt="Image" className="w-full aspect-square object-cover max-h-64" />}
              <button onClick={() => setProduitOuvert(null)} className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white p-2 rounded-full w-10 h-10 flex items-center justify-center">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-1">{produitOuvert.titre || produitOuvert.nom}</h2>
              <p className="text-red-500 font-black mb-6 text-xl">{produitOuvert.prix} DA</p>
              
              {produitOuvert.supplements && produitOuvert.supplements.length > 0 && (
                <>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-zinc-800 pb-2">Personnaliser</h3>
                  <div className="space-y-3 mb-6">
                    {produitOuvert.supplements.map((supp: any, idx: number) => {
                      const estCoche = supplementsCoches.some(s => s.nom === supp.nom);
                      return (
                        <div key={idx} onClick={() => toggleSupplement(supp)} className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer active:scale-[0.98] transition-all ${estCoche ? "bg-red-600/10 border-red-500 shadow-inner shadow-red-500/10" : "bg-zinc-950 border-zinc-800"}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors ${estCoche ? "bg-red-600 border-red-600" : "bg-black border-zinc-700"}`}>
                              {estCoche && <span className="text-white text-sm font-bold">✓</span>}
                            </div>
                            <span className="font-bold text-white text-lg">{supp.nom}</span>
                          </div>
                          <span className="text-gray-400 font-black">+{supp.prix} DA</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-zinc-800 bg-zinc-950 shrink-0">
              <button onClick={() => ajouterAuPanierDirect(produitOuvert, supplementsCoches)} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl uppercase text-sm shadow-xl shadow-red-600/20 flex justify-between px-6 active:scale-[0.98] transition-transform">
                <span>Ajouter au panier</span>
                <span className="bg-white text-red-600 px-3 py-1 rounded-lg">{produitOuvert.prix + supplementsCoches.reduce((t, s) => t + s.prix, 0)} DA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOUTON FLOTTANT PANIER */}
      {panier.length > 0 && !panierOuvert && !produitOuvert && (
        <button onClick={() => setPanierOuvert(true)} className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-green-600 text-white font-black py-5 px-6 rounded-2xl shadow-2xl shadow-green-600/30 flex justify-between items-center z-40 active:scale-[0.98] transition-transform uppercase tracking-wider text-sm">
          <span className="bg-white text-green-600 w-8 h-8 flex items-center justify-center rounded-full">{panier.length}</span>
          <span>Voir mon panier</span>
          <span>{totalPanier} DA</span>
        </button>
      )}

      {/* MODAL PANIER COMPLET */}
      {panierOuvert && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-zinc-900 w-full max-w-md border-t sm:border border-zinc-800 rounded-t-4xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
              <h2 className="text-xl font-bold uppercase tracking-wider text-white">🛍️ Mon Panier</h2>
              <button onClick={() => setPanierOuvert(false)} className="text-gray-400 bg-zinc-900 w-10 h-10 rounded-full flex items-center justify-center">✕</button>
            </div>

            {commandeValidee ? (
              <div className="p-10 text-center overflow-y-auto">
                <span className="text-6xl block mb-6">✅</span>
                <h3 className="text-2xl font-black text-green-500 mb-6 uppercase">Commande Envoyée !</h3>
                
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-8 inline-block shadow-inner">
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">N° de commande</p>
                  <p className="text-5xl font-black text-white">#{numeroCommande}</p>
                </div>

                <p className="text-gray-400 mb-8 font-medium">L'équipe prépare votre repas. Le livreur vous contactera très vite !</p>
                <button onClick={() => { setCommandeValidee(false); setPanierOuvert(false); setNumeroCommande(null); }} className="bg-zinc-800 text-white font-bold py-4 px-8 rounded-2xl uppercase w-full">Retour au menu</button>
              </div>
            ) : (
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4 mb-8">
                  {panier.map((item) => (
                    <div key={item.idUnique} className="flex justify-between items-center bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-lg">{item.nom}</h4>
                        {item.supplements && item.supplements.length > 0 && (
                          <p className="text-xs text-gray-500 leading-tight mt-1 font-medium">
                            + {item.supplements.map((s:any) => s.nom).join(', ')}
                          </p>
                        )}
                        <p className="text-red-500 font-black mt-2">{item.prixTotal} DA</p>
                      </div>
                      <button onClick={() => retirerDuPanier(item.idUnique)} className="text-red-500 bg-red-500/10 p-3 rounded-xl ml-4 active:scale-95 transition-transform">🗑️</button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-end border-t border-zinc-800 pt-6 mb-8">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">Total à payer</span>
                  <span className="text-4xl font-black text-red-500">{totalPanier} DA</span>
                </div>

                <form onSubmit={handleCommander} className="space-y-4 pb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-zinc-800 pb-2">Où livrer ?</h3>
                  <input type="text" required placeholder="Nom complet" value={nomClient} onChange={(e) => setNomClient(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white outline-none focus:border-red-600 font-medium" />
                  <input type="tel" required placeholder="N° Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white outline-none focus:border-red-600 font-medium" />
                  <textarea required rows={2} placeholder="Adresse complète..." value={adresse} onChange={(e) => setAdresse(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white outline-none focus:border-red-600 font-medium" />
                  
                  <button type="submit" disabled={envoiEnCours} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl uppercase text-sm mt-4 shadow-xl shadow-red-600/20 active:scale-[0.98] transition-transform">
                    {envoiEnCours ? "Transmission..." : "🚀 Confirmer la commande"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}