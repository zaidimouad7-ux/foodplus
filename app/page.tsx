"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Connexion à Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORIES = ["Sandwich/Burger", "Accompagnement", "Boisson", "Dessert"];

export default function ClientMenuPage() {
  // --- ÉTATS ---
  const [produits, setProduits] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  
  // Panier
  const [panier, setPanier] = useState<{ produit: any; quantite: number }[]>([]);
  const [panierOuvert, setPanierOuvert] = useState(false);
  
  // Formulaire de commande
  const [nomClient, setNomClient] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [commandeEnCours, setCommandeEnCours] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Charger le menu au démarrage
  useEffect(() => {
    fetchProduits();
  }, []);

  async function fetchProduits() {
    setChargement(true);
    const { data, error } = await supabase.from("produits").select("*").order("id", { ascending: false });
    if (!error) setProduits(data || []);
    setChargement(false);
  }

  // --- GESTION DU PANIER ---
  const ajouterAuPanier = (produit: any) => {
    setPanier((prev) => {
      const existant = prev.find((item) => item.produit.id === produit.id);
      if (existant) {
        return prev.map((item) =>
          item.produit.id === produit.id ? { ...item, quantite: item.quantite + 1 } : item
        );
      }
      return [...prev, { produit, quantite: 1 }];
    });
    // Petite animation ou alerte (optionnel)
  };

  const retirerDuPanier = (produitId: number) => {
    setPanier((prev) => prev.filter((item) => item.produit.id !== produitId));
  };

  const changerQuantite = (produitId: number, delta: number) => {
    setPanier((prev) =>
      prev.map((item) => {
        if (item.produit.id === produitId) {
          const nouvelleQte = item.quantite + delta;
          return nouvelleQte > 0 ? { ...item, quantite: nouvelleQte } : item;
        }
        return item;
      })
    );
  };

  const totalPanier = panier.reduce((total, item) => total + item.produit.prix * item.quantite, 0);
  const totalArticles = panier.reduce((total, item) => total + item.quantite, 0);

  // --- SOUMISSION DE LA COMMANDE ---
  const handleCommander = async (e: React.FormEvent) => {
    e.preventDefault();
    if (panier.length === 0) return;
    setCommandeEnCours(true);
    setMessage(null);

    // Créer un résumé textuel de la commande (ex: "2x Burger, 1x Coca")
    const details = panier.map((item) => `${item.quantite}x ${item.produit.titre || item.produit.nom}`).join(", ");

    try {
      const { error } = await supabase.from("commandes").insert([
        {
          nom_client: nomClient,
          telephone_client: telephone,
          adresse_livraison: adresse,
          total: totalPanier,
          details_commande: details,
          statut: "en attente", // Par défaut
        },
      ]);

      if (error) throw error;

      setMessage({ type: "success", text: "✅ Commande envoyée avec succès ! Nous la préparons." });
      setPanier([]); // Vider le panier
      setNomClient(""); setTelephone(""); setAdresse(""); // Vider le formulaire
      
      // Fermer le panier après 3 secondes
      setTimeout(() => {
        setPanierOuvert(false);
        setMessage(null);
      }, 3000);

    } catch (error: any) {
      setMessage({ type: "error", text: "❌ Erreur : " + error.message });
    } finally {
      setCommandeEnCours(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      
      {/* HEADER / HERO SECTION */}
      <header className="bg-zinc-950 border-b border-zinc-900 py-12 px-6 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">
            FOOD <span className="text-red-600">PLUS</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-medium tracking-wide">
            Le meilleur fast-food directement livré chez vous.
          </p>
        </div>
      </header>

      {/* MENU PAR CATÉGORIES */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {chargement ? (
          <div className="text-center text-gray-500 py-20 animate-pulse text-xl font-bold">Chargement du menu délicieux...</div>
        ) : produits.length === 0 ? (
          <div className="text-center text-gray-500 py-20">Le menu est en cours de préparation. Revenez vite !</div>
        ) : (
          <div className="space-y-16">
            {CATEGORIES.map((cat) => {
              const produitsDeLaCategorie = produits.filter((p) => (p.categorie || CATEGORIES[0]) === cat);
              
              if (produitsDeLaCategorie.length === 0) return null;

              return (
                <section key={cat}>
                  <h2 className="text-3xl font-black text-white border-l-4 border-red-600 pl-4 mb-8 uppercase tracking-widest">
                    {cat}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {produitsDeLaCategorie.map((produit) => (
                      <div key={produit.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-600/50 transition-colors group flex flex-col">
                        {/* Image */}
                        <div className="h-48 w-full bg-zinc-950 relative overflow-hidden">
                          {produit.image_url ? (
                            <img src={produit.image_url} alt={produit.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-800 text-5xl">🍔</div>
                          )}
                        </div>
                        {/* Infos */}
                        <div className="p-5 flex flex-col grow">
                          <div className="flex justify-between items-start mb-2 gap-4">
                            <h3 className="font-bold text-xl uppercase leading-tight">{produit.titre || produit.nom}</h3>
                            <span className="text-red-500 font-black whitespace-nowrap">{produit.prix} DA</span>
                          </div>
                          <p className="text-gray-400 text-sm mb-6 grow line-clamp-2">{produit.description}</p>
                          <button 
                            onClick={() => ajouterAuPanier(produit)}
                            className="w-full bg-zinc-800 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors uppercase tracking-wider text-sm"
                          >
                            Ajouter au panier
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* BOUTON FLOTTANT PANIER */}
      {totalArticles > 0 && (
        <button 
          onClick={() => setPanierOuvert(true)}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-red-600 text-white p-4 rounded-full shadow-2xl shadow-red-600/40 hover:scale-105 transition-transform z-40 flex items-center gap-3 font-bold"
        >
          <span className="text-2xl">🛒</span>
          <span className="bg-white text-red-600 px-3 py-1 rounded-full text-sm">{totalArticles}</span>
          <span className="hidden md:inline mr-2">{totalPanier} DA</span>
        </button>
      )}

      {/* MODAL PANIER & CHECKOUT */}
      {panierOuvert && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay sombre */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPanierOuvert(false)}></div>
          
          {/* Tiroir */}
          <div className="relative w-full max-w-md bg-zinc-950 h-full flex flex-col shadow-2xl border-l border-zinc-800 animate-slide-in">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
              <h2 className="text-2xl font-black uppercase tracking-wider text-white">Mon Panier</h2>
              <button onClick={() => setPanierOuvert(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {panier.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <span className="text-6xl block mb-4">🛒</span>
                  Votre panier est vide.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Liste des articles */}
                  <div className="space-y-4 mb-8">
                    {panier.map((item) => (
                      <div key={item.produit.id} className="flex gap-4 items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                        {item.produit.image_url && (
                          <img src={item.produit.image_url} alt={item.produit.titre} className="w-16 h-16 object-cover rounded-lg" />
                        )}
                        <div className="grow">
                          <h4 className="font-bold text-sm uppercase">{item.produit.titre || item.produit.nom}</h4>
                          <p className="text-red-500 font-bold text-sm">{item.produit.prix * item.quantite} DA</p>
                        </div>
                        <div className="flex items-center gap-2 bg-zinc-950 rounded-lg border border-zinc-800 p-1">
                          <button onClick={() => changerQuantite(item.produit.id, -1)} className="px-2 text-gray-400 hover:text-white">-</button>
                          <span className="font-bold text-sm w-4 text-center">{item.quantite}</span>
                          <button onClick={() => changerQuantite(item.produit.id, 1)} className="px-2 text-gray-400 hover:text-white">+</button>
                        </div>
                        <button onClick={() => retirerDuPanier(item.produit.id)} className="text-zinc-600 hover:text-red-500 ml-2">🗑️</button>
                      </div>
                    ))}
                  </div>

                  {/* Formulaire Client */}
                  <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                    <h3 className="font-bold uppercase tracking-wider mb-4 text-red-500 border-b border-zinc-800 pb-2">Détails de livraison</h3>
                    
                    {message && (
                      <div className={`p-3 rounded-lg mb-4 text-sm font-semibold border ${message.type === "success" ? "bg-green-950/40 border-green-500 text-green-400" : "bg-red-950/40 border-red-500 text-red-400"}`}>
                        {message.text}
                      </div>
                    )}

                    {!message?.text.includes("✅") && (
                      <form onSubmit={handleCommander} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nom et Prénom</label>
                          <input type="text" required value={nomClient} onChange={(e) => setNomClient(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none text-sm" placeholder="Ex: Ali Ammar" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Téléphone</label>
                          <input type="tel" required value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none text-sm" placeholder="Ex: 0550 12 34 56" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Adresse complète</label>
                          <textarea required rows={2} value={adresse} onChange={(e) => setAdresse(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none text-sm" placeholder="Votre adresse exacte..."></textarea>
                        </div>
                        
                        <div className="pt-4 border-t border-zinc-800">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-400 font-bold uppercase">Total à payer</span>
                            <span className="text-2xl font-black text-red-500">{totalPanier} DA</span>
                          </div>
                          <button type="submit" disabled={commandeEnCours} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-black py-4 rounded-xl transition-colors uppercase tracking-widest">
                            {commandeEnCours ? "Envoi en cours..." : "Confirmer la commande"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Configuration d'une petite animation CSS pour le tiroir (à ajouter dans ton globals.css idéalement, mais fonctionne sans) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}