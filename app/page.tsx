"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

// Connexion à Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MenuPage() {
  const [produits, setProduits] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  
  // --- NOUVEAUX ÉTATS POUR LE PANIER ---
  const [panier, setPanier] = useState<any[]>([]);
  const [afficherPanier, setAfficherPanier] = useState(false);
  
  // États pour le formulaire client
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  useEffect(() => {
    fetchProduits();
  }, []);

  async function fetchProduits() {
    const { data, error } = await supabase.from("produits").select("*");
    if (!error) setProduits(data || []);
    setChargement(false);
  }

  // --- FONCTION POUR AJOUTER AU PANIER ---
  const ajouterAuPanier = (produit: any) => {
    setPanier([...panier, produit]);
    alert(`✅ ${produit.titre} a été ajouté au panier !`);
  };

  // Calcul du total
  const totalPanier = panier.reduce((total, item) => total + item.prix, 0);

  // --- FONCTION POUR ENVOYER LA COMMANDE À SUPABASE ---
  const validerCommande = async (e: React.FormEvent) => {
    e.preventDefault();
    if (panier.length === 0) return alert("Votre panier est vide !");
    
    setEnvoiEnCours(true);

    // Création du texte des détails (ex: "1x Burger, 1x Frites")
    const details = panier.map(p => p.titre).join(", ");

    try {
      const { error } = await supabase.from("commandes").insert([
        {
          nom_client: nom,
          telephone_client: telephone,
          adresse_livraison: adresse,
          total: totalPanier,
          details_commande: details,
          statut: "en attente" // Par défaut
        }
      ]);

      if (error) throw error;

      alert("🎉 Commande envoyée avec succès !");
      // On vide le panier et on ferme la fenêtre
      setPanier([]);
      setAfficherPanier(false);
      setNom(""); setTelephone(""); setAdresse("");

    } catch (error: any) {
      alert("❌ Erreur lors de la commande : " + error.message);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans relative">
      
      {/* Bouton Panier Flottant (s'affiche si le panier n'est pas vide) */}
      {panier.length > 0 && (
        <button 
          onClick={() => setAfficherPanier(true)}
          className="fixed bottom-8 right-8 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-2xl z-50 flex items-center font-bold text-lg animate-bounce"
        >
          🛒 Voir Panier ({panier.length}) - {totalPanier} DA
        </button>
      )}

      {/* --- FENÊTRE DU PANIER (MODAL) --- */}
      {afficherPanier && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="bg-zinc-900 border border-red-600 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold uppercase">Votre Commande</h2>
              <button onClick={() => setAfficherPanier(false)} className="text-red-500 font-bold text-xl">X</button>
            </div>

            {/* Résumé des articles */}
            <ul className="mb-6 space-y-2 border-b border-zinc-800 pb-4">
              {panier.map((item, index) => (
                <li key={index} className="flex justify-between text-gray-300">
                  <span>🍔 {item.titre}</span>
                  <span className="font-bold text-white">{item.prix} DA</span>
                </li>
              ))}
              <li className="flex justify-between text-xl font-black text-red-500 pt-4 border-t border-zinc-800">
                <span>TOTAL :</span>
                <span>{totalPanier} DA</span>
              </li>
            </ul>

            {/* Formulaire Client */}
            <form onSubmit={validerCommande} className="space-y-4">
              <input type="text" required placeholder="Votre Nom" value={nom} onChange={e => setNom(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none" />
              
              <input type="tel" required placeholder="Numéro de Téléphone" value={telephone} onChange={e => setTelephone(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none" />
              
              <textarea required placeholder="Adresse de livraison exacte" value={adresse} onChange={e => setAdresse(e.target.value)} rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none" />

              <button type="submit" disabled={envoiEnCours}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg uppercase transition-colors"
              >
                {envoiEnCours ? "Envoi..." : "Confirmer la commande"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- PAGE PRINCIPALE (MENU) --- */}
      <div className="flex flex-col items-center mb-12 mt-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center uppercase tracking-wider">
          Menu <span className="text-red-600">Food Plus</span>
        </h1>
        <div className="h-1 w-24 bg-red-600 mt-4 rounded-full"></div>
      </div>

      {chargement ? (
        <div className="text-center text-xl text-gray-400 mt-20 animate-pulse">Chargement du menu...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {produits.map((produit) => (
            <div key={produit.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl flex flex-col justify-between hover:border-red-600 transition-all duration-300">
              
              <div className="h-56 w-full relative bg-zinc-950">
                {produit.image_url ? (
                  <img src={produit.image_url} alt={produit.titre} className="object-cover w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-zinc-700">Pas d'image</div>
                )}
              </div>

              <div className="p-6 flex flex-col grow">
                <h2 className="text-2xl font-bold mb-3 uppercase">{produit.titre}</h2>
                <p className="text-gray-400 text-sm mb-6 grow">{produit.description}</p>
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-zinc-800">
                  <span className="text-3xl font-black text-red-500">{produit.prix} <span className="text-lg">DA</span></span>
                  
                  {/* C'est ICI que la magie opère : onClick={() => ajouterAuPanier(produit)} */}
                  <button 
                    onClick={() => ajouterAuPanier(produit)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg uppercase"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}