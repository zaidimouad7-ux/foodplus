"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// CONNEXION DIRECTE À SUPABASE
const supabaseUrl = "https://kzubxrbuuiersdxwmoyj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6dWJ4cmJ1dWllcnNkeHdtb3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjc4MDAsImV4cCI6MjA5NzgwMzgwMH0.BImuZKbk-p77HMqHmChndnK1SPslpcfNJBqYa5AWFYg";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MenuRestaurant() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [produits, setProduits] = useState<any[]>([]);
  const [panier, setPanier] = useState<any[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  
  // 💡 NOUVEAU : Un état pour afficher l'erreur sur le téléphone
  const [erreurMobile, setErreurMobile] = useState<string | null>(null);

  // États pour le formulaire de livraison
  const [nomClient, setNomClient] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [notesClient, setNotesClient] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [commandeValidee, setCommandeValidee] = useState(false);

  useEffect(() => {
    // Sécurité : On arrête de chercher au bout de 10 secondes
    const timeout = setTimeout(() => {
      setErreurMobile("Le réseau de ce téléphone bloque la connexion à la base de données (Délai dépassé).");
      setChargement(false);
    }, 10000);

    async function chargerDonnees() {
      try {
        const { data: restoData, error: restoError } = await supabase
          .from('restaurants')
          .select('*')
          .limit(1)
          .single();

        if (restoError) throw restoError;
        setRestaurant(restoData);

        if (restoData) {
          const { data: produitsData, error: produitsError } = await supabase
            .from('produits')
            .select('*')
            .eq('restaurant_id', restoData.id)
            .eq('disponible', true);

          if (produitsError) throw produitsError;
          setProduits(produitsData || []);
        }
      } catch (error: any) { 
        console.error("Erreur :", error.message);
        setErreurMobile(error.message); // On capture l'erreur ici !
      } finally {
        clearTimeout(timeout); // On annule le chrono si ça a marché
        setChargement(false);
      }
    }

    chargerDonnees();
  }, []);

  // ... (Garde tes fonctions ajouterAuPanier et soumettreCommande telles quelles ici) ...
  const ajouterAuPanier = (produit: any) => {
    setPanier((panierActuel) => {
      const existe = panierActuel.find((item) => item.id === produit.id);
      if (existe) {
        return panierActuel.map((item) =>
          item.id === produit.id ? { ...item, quantite: item.quantite + 1 } : item
        );
      }
      return [...panierActuel, { ...produit, quantite: 1 }];
    });
    setCommandeValidee(false);
  };

  const totalPanier = panier.reduce((total, item) => total + item.prix * item.quantite, 0);

  const soumettreCommande = async () => {
    if (!nomClient || !telephone || !adresse) {
      alert("Veuillez remplir toutes vos informations de livraison 🛵");
      return;
    }

    setEnvoiEnCours(true);
    const resumeCommande = panier.map(item => `${item.quantite}x ${item.nom}`).join(' | ');

    try {
      const { error } = await supabase
        .from('commandes')
        .insert([
          {
            nom_client: nomClient,
            telephone_client: telephone,
            adresse_livraison: adresse,
            total: totalPanier,
            statut: 'En attente',
            details: resumeCommande,
            notes_client: notesClient
          }
        ]);

      if (error) throw error;

      setPanier([]);
      setNomClient("");
      setTelephone("");
      setAdresse("");
      setNotesClient("");
      setCommandeValidee(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error: any) {
      alert("Une erreur est survenue lors de la commande.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  // 💡 NOUVEAU : Affichage de l'erreur
  if (erreurMobile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="text-xl text-red-600 font-bold mb-2">Erreur de connexion</p>
        <p className="text-gray-700 bg-gray-200 p-4 rounded-xl">{erreurMobile}</p>
        <p className="text-sm text-gray-500 mt-6">Prends une photo de cet écran !</p>
      </div>
    );
  }

  if (chargement) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-400">
        <div className="text-7xl animate-bounce drop-shadow-lg">🛵</div>
        <p className="mt-6 text-white font-black text-3xl uppercase tracking-tighter drop-shadow-md">Le four chauffe...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] font-sans text-gray-900 selection:bg-[#0f4d22] selection:text-white pb-24">
      
      <header className="bg-linear-to-br from-orange-500 via-orange-400 to-yellow-400 py-12 px-4 shadow-2xl text-center relative overflow-hidden border-b-8 border-yellow-300 flex flex-col items-center">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none flex flex-wrap gap-12 text-5xl items-center justify-center -rotate-12 scale-150">
           🍕 🛵 🥤 🍕 🛵 🥤 🍕 🛵 🥤
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
          <img 
            src="/logo.jpg" 
            alt="Logo du Fast Food" 
            className="w-56 h-56 md:w-64 md:h-64 object-cover rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.4)] border-4 border-white mb-6 hover:scale-105 transition-transform duration-500"
          />
          <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)] mb-4 uppercase">
            {restaurant.nom}
          </h1>
          <p className="text-white font-black text-lg md:text-xl bg-[#0f4d22] inline-block px-8 py-3 rounded-full uppercase tracking-widest border-2 border-[#1a6e34] shadow-lg">
            🔥 Chaud, Rapide & Délicieux 🔥
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-6 relative z-20">
        
        <div className="lg:col-span-2">
          {commandeValidee && (
            <div className="bg-linear-to-r from-yellow-400 to-[#0f4d22] border-4 border-white text-white p-6 rounded-[30px] mb-8 shadow-2xl flex items-center gap-4 animate-bounce">
              <span className="text-5xl">🛵</span>
              <div>
                <p className="text-2xl font-black uppercase italic tracking-tighter">C'est dans la boîte !</p>
                <p className="font-bold text-sm">Votre commande a été envoyée et est en cours de préparation.</p>
              </div>
            </div>
          )}

          {produits.length === 0 ? (
            <p className="text-gray-500 font-bold text-center mt-10">Le menu est en cours de mise à jour...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {produits.map((p) => (
                <div key={p.id} className="bg-white rounded-[30px] shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-4 border-orange-50 hover:border-yellow-400 group flex flex-col">
                  <div className="h-60 bg-orange-100 relative overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.nom} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl group-hover:scale-125 transition-transform duration-500">🍕</div>
                    )}
                    <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 font-black px-5 py-2 rounded-2xl shadow-xl text-lg rotate-3 group-hover:rotate-6 transition-transform border-2 border-white">
                      {p.prix} DA
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-3xl font-black text-gray-800 mb-2 uppercase italic tracking-tight">{p.nom}</h3>
                    <p className="text-gray-500 text-sm flex-1 mb-6 font-medium">
                      {p.description || "Recette maison préparée avec passion."}
                    </p>
                    <button 
                      onClick={() => ajouterAuPanier(p)}
                      className="w-full bg-[#0f4d22] hover:bg-[#1a6e34] text-white font-black py-4 rounded-2xl shadow-md hover:shadow-xl transition-all uppercase tracking-wider flex items-center justify-center gap-3 active:scale-95"
                    >
                      <span>Ajouter au panier</span>
                      <span className="bg-white text-[#0f4d22] px-3 py-1 rounded-xl text-sm">+</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-[40px] p-8 shadow-2xl border-8 border-yellow-400 sticky top-8">
            <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3 uppercase italic tracking-tighter">
               🛒 Mon Panier
            </h2>
            
            {panier.length === 0 ? (
              <div className="text-center py-12 bg-orange-50 rounded-3xl border-2 border-dashed border-orange-200">
                <span className="text-5xl opacity-50 block mb-4">💨</span>
                <p className="text-orange-800 font-black italic uppercase">Ton panier est vide</p>
                <p className="text-sm text-orange-600/70 mt-2 font-bold">Ajoute un plat pour commencer !</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="max-h-[30vh] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-orange-200">
                  {panier.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-orange-50 p-4 rounded-2xl border-2 border-orange-100">
                      <div className="flex-1">
                        <p className="font-black text-gray-800 uppercase text-sm italic">{item.nom}</p>
                        <p className="text-xs text-orange-500 font-black tracking-widest bg-orange-100 inline-block px-2 py-0.5 rounded-md mt-1">
                          {item.quantite} x {item.prix} DA
                        </p>
                      </div>
                      <p className="font-black text-gray-900 text-lg ml-4">{item.prix * item.quantite} DA</p>
                    </div>
                  ))}
                </div>
                
                <div className="border-t-4 border-dashed border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-2xl">
                    <span className="text-gray-500 font-black uppercase tracking-widest text-sm">Total</span>
                    <span className="text-4xl font-black text-orange-600 tracking-tighter italic">{totalPanier} DA</span>
                  </div>

                  <div className="space-y-3 mt-6">
                    <input 
                      type="text" 
                      placeholder="👤 NOM COMPLET *" 
                      value={nomClient}
                      onChange={(e) => setNomClient(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-4 border-transparent rounded-2xl focus:border-yellow-400 focus:bg-white focus:outline-none transition-all font-black placeholder:text-gray-400 text-gray-800"
                    />
                    <input 
                      type="tel" 
                      placeholder="📱 TÉLÉPHONE *" 
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-4 border-transparent rounded-2xl focus:border-yellow-400 focus:bg-white focus:outline-none transition-all font-black placeholder:text-gray-400 text-gray-800"
                    />
                    <textarea 
                      placeholder="📍 ADRESSE DE LIVRAISON *" 
                      value={adresse}
                      onChange={(e) => setAdresse(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-4 border-transparent rounded-2xl focus:border-yellow-400 focus:bg-white focus:outline-none transition-all font-black placeholder:text-gray-400 text-gray-800 h-24 resize-none"
                    />
                    {/* 💡 NOUVEAU : Le champ "Demande spéciale" */}
                    <textarea 
                      placeholder="✍️ DEMANDE SPÉCIALE (Sans oignons, supplément sauce...)" 
                      value={notesClient}
                      onChange={(e) => setNotesClient(e.target.value)}
                      className="w-full p-4 bg-yellow-50 border-4 border-transparent rounded-2xl focus:border-yellow-400 focus:bg-white focus:outline-none transition-all font-black placeholder:text-yellow-700/50 text-gray-800 h-20 resize-none"
                    />
                  </div>

                  <button 
                    onClick={soumettreCommande}
                    disabled={envoiEnCours}
                    className={`w-full py-5 rounded-2xl font-black text-2xl mt-6 transition-all shadow-[0_10px_20px_rgba(250,204,21,0.4)] uppercase tracking-tighter italic flex justify-center items-center gap-2 ${
                      envoiEnCours ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {envoiEnCours ? 'Envoi...' : '🚀 Commander !'}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-4 uppercase font-black tracking-widest">💸 Paiement à la livraison</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}