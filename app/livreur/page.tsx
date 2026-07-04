"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Connexion à Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LivreurInterface() {
  const [livreurs, setLivreurs] = useState<any[]>([]);
  const [livreurActif, setLivreurActif] = useState<any | null>(null);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [chargement, setChargement] = useState(false);

  // Charger la liste des livreurs au démarrage
  useEffect(() => {
    fetchLivreurs();
  }, []);

  // Charger les commandes dès qu'un livreur se connecte
  useEffect(() => {
    if (livreurActif) {
      fetchCommandesLivreur();
    }
  }, [livreurActif]);

  async function fetchLivreurs() {
    const { data } = await supabase.from("livreurs").select("*").order("nom");
    if (data) setLivreurs(data);
  }

  async function fetchCommandesLivreur() {
    setChargement(true);
    // On ne récupère que LES COMMANDES EN ROUTE assignées à CE LIVREUR
    const { data, error } = await supabase
      .from("commandes")
      .select("*")
      .eq("livreur_id", livreurActif.id)
      .eq("statut", "en route")
      .order("id", { ascending: true }); // Les plus anciennes d'abord
    
    if (!error) setCommandes(data || []);
    setChargement(false);
  }

  async function validerLivraison(commandeId: number) {
    if (!window.confirm("Confirmer que la commande a bien été livrée au client ?")) return;

    const { error } = await supabase
      .from("commandes")
      .update({ statut: "livré" })
      .eq("id", commandeId);

    if (!error) {
      fetchCommandesLivreur(); // Met à jour la liste (la commande disparaîtra de l'écran)
    } else {
      alert("Erreur lors de la validation : " + error.message);
    }
  }

  // --- ÉCRAN 1 : CHOIX DU LIVREUR ---
  if (!livreurActif) {
    return (
      <div className="min-h-screen bg-black text-white p-6 font-sans flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black uppercase tracking-wider mb-2 text-center">
          Food <span className="text-red-600">Plus</span>
        </h1>
        <p className="text-gray-400 mb-8 uppercase tracking-widest text-sm">Interface Livreur</p>
        
        <div className="w-full max-w-sm space-y-4">
          <h2 className="text-center text-gray-500 mb-4">Qui êtes-vous ?</h2>
          {livreurs.length === 0 ? (
            <p className="text-center text-red-500 bg-red-950/30 p-4 rounded-xl border border-red-500/20">
              Aucun livreur enregistré. L'admin doit en ajouter.
            </p>
          ) : (
            livreurs.map((livreur, index) => (
              <button
                key={livreur.id || index}
                onClick={() => setLivreurActif(livreur)}
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-red-500 p-5 rounded-2xl text-xl font-bold transition-all flex items-center justify-between group"
              >
                <span>🛵 {livreur.nom}</span>
                <span className="text-zinc-600 group-hover:text-red-500">→</span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // --- ÉCRAN 2 : LES COMMANDES DU LIVREUR ---
  return (
    <div className="min-h-screen bg-black text-white font-sans pb-10">
      {/* HEADER LIVREUR */}
      <header className="bg-zinc-950 border-b border-zinc-800 p-4 sticky top-0 z-10 flex justify-between items-center shadow-2xl">
        <div>
          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Connecté en tant que</p>
          <h1 className="text-lg font-black text-red-500 uppercase">{livreurActif.nom}</h1>
        </div>
        <button 
          onClick={() => setLivreurActif(null)} 
          className="bg-zinc-900 text-xs text-gray-400 px-3 py-2 rounded-lg border border-zinc-800"
        >
          Déconnexion
        </button>
      </header>

      {/* LISTE DES MISSIONS */}
      <main className="p-4 max-w-md mx-auto mt-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider">📦 Mes courses ({commandes.length})</h2>
          <button onClick={fetchCommandesLivreur} className="text-2xl bg-zinc-900 p-2 rounded-full border border-zinc-800 active:scale-95 transition-transform">
            🔄
          </button>
        </div>

        {chargement ? (
          <div className="text-center text-gray-500 py-10 animate-pulse">Recherche de commandes...</div>
        ) : commandes.length === 0 ? (
          <div className="text-center bg-zinc-950 border border-zinc-900 rounded-2xl p-10 mt-10">
            <span className="text-6xl block mb-4">☕</span>
            <p className="text-gray-400 font-medium">Aucune commande en route pour le moment. Attendez les instructions du resto.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {commandes.map((cmd) => (
              <div key={cmd.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                
                {/* Infos Client */}
                <div className="p-5 border-b border-zinc-800 bg-zinc-950">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-xl text-white uppercase">{cmd.nom_client}</h3>
                    <span className="bg-red-600/20 text-red-500 px-2 py-1 rounded text-xs font-black uppercase border border-red-600/20">
                      {cmd.total} DA
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">📍 {cmd.adresse}</p>
                  
                  <div className="bg-black/50 p-3 rounded-xl border border-zinc-800/50">
                    <p className="text-xs text-gray-500 uppercase mb-1">Détails commande :</p>
                    <p className="text-sm font-medium">{cmd.details_commande}</p>
                  </div>
                </div>

                {/* Actions GPS & Tel */}
                <div className="grid grid-cols-2 divide-x divide-zinc-800 border-b border-zinc-800 bg-zinc-900">
                  <a 
                    href={`tel:${cmd.telephone_client || cmd.telephone}`} 
                    className="py-4 flex flex-col items-center justify-center text-blue-400 hover:bg-zinc-800 active:bg-zinc-800 transition-colors"
                  >
                    <span className="text-2xl mb-1">📞</span>
                    <span className="text-xs font-bold uppercase tracking-widest">Appeler</span>
                  </a>
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(cmd.adresse)}`} 
                    target="_blank" rel="noopener noreferrer"
                    className="py-4 flex flex-col items-center justify-center text-amber-500 hover:bg-zinc-800 active:bg-zinc-800 transition-colors"
                  >
                    <span className="text-2xl mb-1">🗺️</span>
                    <span className="text-xs font-bold uppercase tracking-widest">GPS Maps</span>
                  </a>
                </div>

                {/* Bouton Valider */}
                <div className="p-4">
                  <button 
                    onClick={() => validerLivraison(cmd.id)}
                    className="w-full bg-green-600 text-white font-black py-4 rounded-xl uppercase tracking-widest text-sm shadow-lg shadow-green-600/20 active:scale-95 transition-all"
                  >
                    ✅ Valider la livraison
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}