"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Connexion à Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CommandesPage() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);

  // Charger les commandes au démarrage
  useEffect(() => {
    fetchCommandes();
  }, []);

  async function fetchCommandes() {
    // ATTENTION: Vérifie que ta table s'appelle bien "commandes"
    const { data, error } = await supabase
      .from("commandes")
      .select("*")
      

    if (error) {
     console.error("Erreur de chargement:", error.message || JSON.stringify(error));
    } else {
      setCommandes(data || []);
    }
    setChargement(false);
  }

  // Fonction pour changer le statut d'une commande
  async function changerStatut(id: string, nouveauStatut: string) {
    const { error } = await supabase
      .from("commandes")
      .update({ statut: nouveauStatut }) // Assure-toi d'avoir une colonne "statut"
      .eq("id", id);

    if (error) {
      alert("Erreur lors de la mise à jour du statut.");
      console.error(error);
    } else {
      // Recharger la liste pour voir le changement
      fetchCommandes();
    }
  }

  // Séparer les commandes pour l'affichage
  const commandesEnAttente = commandes.filter((c) => c.statut !== "livree");
  const commandesLivrees = commandes.filter((c) => c.statut === "livree");

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* En-tête */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold uppercase tracking-wide">
            Gestion des <span className="text-red-600">Commandes</span>
          </h1>
          <div className="h-1 w-24 bg-red-600 mt-4 rounded-full mx-auto"></div>
        </div>

        {chargement ? (
          <div className="text-center text-gray-400 animate-pulse">Chargement des commandes...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLONNE 1 : Commandes en attente */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-red-500">
                <span className="bg-red-600/20 p-2 rounded-lg mr-3">🔥</span> 
                Nouvelles Commandes ({commandesEnAttente.length})
              </h2>
              
              <div className="space-y-4">
                {commandesEnAttente.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Aucune commande en attente.</p>
                ) : (
                  commandesEnAttente.map((commande) => (
                    <div key={commande.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-lg">{commande.nom_client}</p>
                          <p className="text-sm text-gray-400">📞 {commande.telephone}</p>
                        </div>
                        <span className="font-black text-xl text-red-500">{commande.total} DA</span>
                      </div>
                      
                      <div className="mb-4 text-gray-300 text-sm bg-zinc-900 p-3 rounded-lg">
                        <p>📍 <span className="font-semibold text-white">Adresse:</span> {commande.adresse}</p>
                        <p className="mt-1">🍔 <span className="font-semibold text-white">Détails:</span> {commande.details_commande}</p>
                      </div>

                      <button 
                        onClick={() => changerStatut(commande.id, "livree")}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors uppercase text-sm tracking-wide"
                      >
                        ✅ Marquer comme livrée
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* COLONNE 2 : Commandes livrées */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl opacity-80">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-300">
                <span className="bg-zinc-800 p-2 rounded-lg mr-3">✔️</span> 
                Historique (Livrées)
              </h2>
              
              <div className="space-y-4">
                {commandesLivrees.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Aucun historique.</p>
                ) : (
                  commandesLivrees.map((commande) => (
                    <div key={commande.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-300">{commande.nom_client}</p>
                        <p className="text-xs text-gray-500">{commande.adresse}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-400">{commande.total} DA</p>
                        <span className="text-xs text-green-500 font-semibold bg-green-900/30 px-2 py-1 rounded">Livrée</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}