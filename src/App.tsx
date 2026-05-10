import { useEffect, useMemo, useState } from "react";
import removeBackground from "@imgly/background-removal";
import { supabase } from "./supabase";

type Usage = "travail" | "detente" | "sortie";
type Humeur =
  | "detente"
  | "motivee"
  | "elegante"
  | "dynamique"
  | "cocooning"
  | "festive";
type Categorie = "haut" | "bas" | "chaussures" | "accessoires";
type Saison = "ete" | "hiver" | "mi";
type Page =
  | "accueil"
  | "assistant"
  | "ajouter"
  | "bibliotheque"
  | "creation"
  | "selectionVetement"
  | "tenues";

type ProfilUtilisateur = {
  nom: string;
  prenom: string;
  ville: string;
};

type Vetement = {
  nom: string;
  usages: Usage[];
  saisons?: Saison[];
  humeurs?: Humeur[];
  image?: string | null;
  image_url?: string | null;
};

type VetementBiblio = {
  id: number;
  nom: string;
  categorie: Categorie;
  saison?: Saison | null;
  usage?: Usage | null;
  humeur?: Humeur | null;
  saisons?: Saison[] | null;
  usages?: Usage[] | null;
  humeurs?: Humeur[] | null;
  image: string | null;
  image_url?: string | null;
};

type PieceTenue = {
  nom: string;
  image?: string | null;
  image_url?: string | null;
} | null;

type TenueValidee = {
  haut: PieceTenue;
  bas: PieceTenue;
  chaussures: PieceTenue;
  accessoires: PieceTenue;
  date: string;
  usage: Usage;
  humeur: Humeur;
  ville?: string;
  meteoLabel?: string;
};

type MeteoData = {
  temperature: number;
  description: string;
  ville: string;
  icon: string;
};

const C = {
  bg: "url('/IMAGE/fond.png')",
  card: "#fffaf6",
  accent: "#c9956a",
  text: "#2c2018",
  muted: "#8c6e60",
  soft: "#f5ebe5",
  border: "#e2c9ba",
};

const HUMEURS: { key: Humeur; label: string }[] = [
  { key: "detente", label: "Détendue" },
  { key: "motivee", label: "Motivée" },
  { key: "elegante", label: "Élégante" },
  { key: "dynamique", label: "Dynamique" },
  { key: "cocooning", label: "Cocooning" },
  { key: "festive", label: "Festive" },
];

const HUMEURS_AJOUT: { id: Humeur; label: string }[] = [
  { id: "detente", label: "🌿 Détente" },
  { id: "motivee", label: "💪 Motivée" },
  { id: "elegante", label: "✨ Élégante" },
  { id: "dynamique", label: "⚡ Dynamique" },
  { id: "cocooning", label: "🧸 Cocooning" },
  { id: "festive", label: "🎉 Festive" },
];

export default function App() {
  const [page, setPage] = useState<Page>("accueil");

  const [profil, setProfil] = useState<ProfilUtilisateur | null>(() => {
    const saved = localStorage.getItem("profilUtilisateur");

    if (!saved || saved === "undefined") return null;

    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [nomProfil, setNomProfil] = useState("");
  const [prenomProfil, setPrenomProfil] = useState("");
  const [villeProfil, setVilleProfil] = useState("");

  // 👇 LE useEffect VA ICI
  useEffect(() => {
    if (profil?.ville) {
      setVilleRecherchee(profil.ville);
    }
  }, [profil]);

  const enregistrerProfil = () => {
    if (!prenomProfil || !villeProfil) {
      alert("Merci de remplir le prénom et la ville");
      return;
    }

    const nouveauProfil: ProfilUtilisateur = {
      nom: nomProfil,
      prenom: prenomProfil,
      ville: villeProfil,
    };

    localStorage.setItem("profilUtilisateur", JSON.stringify(nouveauProfil));

    setProfil(nouveauProfil);

    console.log("Météo à charger pour :", villeProfil);
  };

  const [usageChoisi, setUsageChoisi] = useState<Usage>("travail");
  const supprimerTenue = async (id: number) => {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer cette tenue ?"
    );

    if (!confirmation) return;

    const { error } = await supabase.from("tenues").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Erreur lors de la suppression");
      return;
    }

    setTenuesValidees((prev) => prev.filter((t) => t.id !== id));
  };
  const [ville, setVille] = useState("");
  const [villeRecherchee, setVilleRecherchee] = useState("Paris");
  const [meteo, setMeteo] = useState<MeteoData | null>(null);
  const [erreurMeteo, setErreurMeteo] = useState("");

  const [humeur, setHumeur] = useState<Humeur>("detente");
  const [refresh, setRefresh] = useState(0);
  const [fade, setFade] = useState(true);

  const [tenuesValidees, setTenuesValidees] = useState<any[]>([]);

  const [bibliothequeVetements, setBibliothequeVetements] = useState<
    VetementBiblio[]
  >(() => {
    const saved = localStorage.getItem("bibliothequeVetements");
    if (!saved || saved === "undefined") return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [nomVetement, setNomVetement] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [nettoyageEnCours, setNettoyageEnCours] = useState(false);
  const [categorie, setCategorie] = useState<Categorie>("haut");
  const [categorieSelectionnee, setCategorieSelectionnee] =
    useState<Categorie | null>(null);

  const [tenueCreee, setTenueCreee] = useState<{
    haut: VetementBiblio | null;
    bas: VetementBiblio | null;
    chaussures: VetementBiblio | null;
    accessoires: VetementBiblio | null;
  }>({
    haut: null,
    bas: null,
    chaussures: null,
    accessoires: null,
  });

  const [saisonsVetement, setSaisonsVetement] = useState<Saison[]>(["ete"]);
  const [usagesVetement, setUsagesVetement] = useState<Usage[]>(["travail"]);
  const [humeursVetement, setHumeursVetement] = useState<Humeur[]>(["motivee"]);

  const resetAjouterVetement = () => {
    setNomVetement("");
    setImage(null);
    setCategorie("haut");
    setSaisonsVetement(["ete"]);
    setUsagesVetement(["travail"]);
    setHumeursVetement(["motivee"]);
  };

  const [choixOuvert, setChoixOuvert] = useState<
    null | "haut" | "bas" | "chaussures"
  >(null);

  const formaterVetementsSupabase = (data: any[]): VetementBiblio[] => {
    return data.map((item) => ({
      id: item.id,
      nom: item.nom,
      categorie: item.categorie,
      saison: item.saison,
      usage: item.usage,
      humeur: item.humeur,
      saisons: item.saisons,
      usages: item.usages,
      humeurs: item.humeurs,
      image: item.image_url || item.image || null,
      image_url: item.image_url || item.image || null,
    }));
  };

  const chargerVetements = async () => {
    const { data, error } = await supabase
      .from("vetements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement vêtements :", error);
      return;
    }

    if (data) {
      setBibliothequeVetements(formaterVetementsSupabase(data));
    }
  };

  const chargerTenues = async () => {
    const { data, error } = await supabase
      .from("tenues")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement tenues :", error);
      return;
    }

    if (data) {
      setTenuesValidees(data);
    }
  };

  useEffect(() => {
    chargerVetements();
    chargerTenues();
  }, []);

  const toggleSaisonVetement = (valeur: Saison) => {
    setSaisonsVetement((prev) =>
      prev.includes(valeur)
        ? prev.filter((item) => item !== valeur)
        : [...prev, valeur]
    );
  };

  const toggleUsageVetement = (valeur: Usage) => {
    setUsagesVetement((prev) =>
      prev.includes(valeur)
        ? prev.filter((item) => item !== valeur)
        : [...prev, valeur]
    );
  };

  const toggleHumeurVetement = (valeur: Humeur) => {
    setHumeursVetement((prev) =>
      prev.includes(valeur)
        ? prev.filter((item) => item !== valeur)
        : [...prev, valeur]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const nettoyerVetement = async () => {
    if (!image) {
      alert("Ajoute d'abord une photo du vêtement");
      return;
    }

    try {
      setNettoyageEnCours(true);

      const blobNettoye = await removeBackground(image, {
        model: "small",
        device: "cpu",
        proxyToWorker: false,
        debug: true,
      });

      const urlNettoyee = URL.createObjectURL(blobNettoye);
      setImage(urlNettoyee);

      alert("Vêtement nettoyé ✨");
    } catch (error) {
      console.error("Erreur nettoyage complète :", error);
      alert("Le nettoyage IA bloque dans CodeSandbox.");
    } finally {
      setNettoyageEnCours(false);
    }
  };

  const [vetements] = useState<{
    haut: Vetement[];
    bas: Vetement[];
    chaussures: Vetement[];
    accessoires: Vetement[];
  }>({
    haut: [
      {
        nom: "👚 Chemisier blanc",
        usages: ["travail"],
        humeurs: ["motivee", "elegante"],
        saisons: ["mi", "ete"],
      },
      {
        nom: "🧥 Blazer noir",
        usages: ["travail"],
        humeurs: ["motivee", "elegante", "dynamique"],
        saisons: ["mi", "hiver"],
      },
      {
        nom: "👕 Top beige",
        usages: ["travail"],
        humeurs: ["detente", "motivee"],
        saisons: ["ete", "mi"],
      },
      {
        nom: "🧶 Pull cocooning",
        usages: ["detente"],
        humeurs: ["cocooning", "detente"],
        saisons: ["hiver"],
      },
      {
        nom: "👕 T-shirt oversize",
        usages: ["detente"],
        humeurs: ["detente", "dynamique"],
        saisons: ["ete", "mi"],
      },
      {
        nom: "✨ Top noir chic",
        usages: ["sortie"],
        humeurs: ["elegante", "festive"],
        saisons: ["ete", "mi"],
      },
      {
        nom: "👚 Blouse satinée",
        usages: ["sortie"],
        humeurs: ["elegante", "festive"],
        saisons: ["mi", "hiver"],
      },
    ],
    bas: [
      {
        nom: "👖 Pantalon tailleur",
        usages: ["travail"],
        humeurs: ["motivee", "elegante"],
        saisons: ["mi", "hiver"],
      },
      {
        nom: "🖤 Pantalon noir droit",
        usages: ["travail"],
        humeurs: ["motivee", "dynamique"],
        saisons: ["mi", "hiver"],
      },
      {
        nom: "🤎 Jupe midi",
        usages: ["travail"],
        humeurs: ["elegante"],
        saisons: ["ete", "mi"],
      },
      {
        nom: "🩳 Jean relax",
        usages: ["detente"],
        humeurs: ["detente", "dynamique"],
        saisons: ["mi", "hiver"],
      },
      {
        nom: "👖 Legging confort",
        usages: ["detente"],
        humeurs: ["cocooning", "detente"],
        saisons: ["hiver", "mi"],
      },
      {
        nom: "👗 Jupe élégante",
        usages: ["sortie"],
        humeurs: ["elegante", "festive"],
        saisons: ["ete", "mi"],
      },
      {
        nom: "✨ Pantalon fluide chic",
        usages: ["sortie"],
        humeurs: ["elegante", "festive"],
        saisons: ["ete", "mi"],
      },
    ],
    chaussures: [
      {
        nom: "🥿 Mocassins",
        usages: ["travail"],
        humeurs: ["motivee", "elegante"],
        saisons: ["mi", "ete"],
      },
      {
        nom: "👠 Escarpins sobres",
        usages: ["travail"],
        humeurs: ["elegante", "motivee"],
        saisons: ["mi", "ete"],
      },
      {
        nom: "👟 Baskets",
        usages: ["detente"],
        humeurs: ["detente", "dynamique"],
        saisons: ["ete", "mi", "hiver"],
      },
      {
        nom: "🩴 Sandales plates",
        usages: ["detente"],
        humeurs: ["detente"],
        saisons: ["ete"],
      },
      {
        nom: "👠 Talons",
        usages: ["sortie"],
        humeurs: ["elegante", "festive"],
        saisons: ["ete", "mi"],
      },
      {
        nom: "✨ Bottines chic",
        usages: ["sortie"],
        humeurs: ["elegante", "festive"],
        saisons: ["hiver", "mi"],
      },
      {
        nom: "🥾 Bottines pluie",
        usages: ["travail", "detente", "sortie"],
        humeurs: [
          "detente",
          "motivee",
          "elegante",
          "dynamique",
          "cocooning",
          "festive",
        ],
        saisons: ["hiver", "mi"],
      },
    ],
    accessoires: [
      {
        nom: "👜 Sac structuré",
        usages: ["travail"],
        humeurs: ["motivee", "elegante"],
        saisons: ["ete", "mi", "hiver"],
      },
      {
        nom: "⌚ Montre élégante",
        usages: ["travail"],
        humeurs: ["motivee", "elegante"],
        saisons: ["ete", "mi", "hiver"],
      },
      {
        nom: "🧢 Casquette",
        usages: ["detente"],
        humeurs: ["dynamique", "detente"],
        saisons: ["ete"],
      },
      {
        nom: "🎒 Sac casual",
        usages: ["detente"],
        humeurs: ["detente", "dynamique"],
        saisons: ["ete", "mi", "hiver"],
      },
      {
        nom: "💎 Pochette chic",
        usages: ["sortie"],
        humeurs: ["elegante", "festive"],
        saisons: ["ete", "mi", "hiver"],
      },
      {
        nom: "✨ Boucles d’oreilles",
        usages: ["sortie"],
        humeurs: ["elegante", "festive"],
        saisons: ["ete", "mi", "hiver"],
      },
      {
        nom: "🧣 Écharpe douce",
        usages: ["travail", "detente", "sortie"],
        humeurs: ["cocooning", "elegante", "motivee", "detente"],
        saisons: ["hiver"],
      },
      {
        nom: "🕶 Lunettes de soleil",
        usages: ["travail", "detente", "sortie"],
        humeurs: ["dynamique", "detente", "elegante", "festive"],
        saisons: ["ete"],
      },
      {
        nom: "☔ Parapluie chic",
        usages: ["travail", "detente", "sortie"],
        humeurs: [
          "motivee",
          "detente",
          "elegante",
          "dynamique",
          "cocooning",
          "festive",
        ],
        saisons: ["mi", "hiver"],
      },
    ],
  });

  function getTypeMeteo() {
    if (!meteo?.description) return "normal";
    const description = meteo.description.toLowerCase();
    if (description.includes("pluie") || description.includes("averse"))
      return "pluie";
    if (
      description.includes("neige") ||
      description.includes("froid") ||
      (meteo.temperature <= 8 && !description.includes("soleil"))
    )
      return "froid";
    if (
      description.includes("ciel dégagé") ||
      description.includes("ensoleillé") ||
      description.includes("soleil") ||
      meteo.temperature >= 23
    )
      return "soleil";
    if (description.includes("nuage")) return "nuageux";
    return "normal";
  }

  const meteoType = getTypeMeteo();

  function getSaisonDepuisMeteo(): Saison {
    if (!meteo) return "mi";
    if (meteo.temperature <= 8) return "hiver";
    if (meteo.temperature >= 22) return "ete";
    return "mi";
  }

  function getWeatherImage(icon: string) {
    if (!icon) return "/IMAGE/Nuageux.png";
    const code = icon.substring(0, 2);
    switch (code) {
      case "01":
        return "/IMAGE/soleil.png";
      case "02":
        return "/IMAGE/partiellement nuageux.png";
      case "03":
      case "04":
        return "/IMAGE/Nuageux.png";
      case "09":
      case "10":
        return "/IMAGE/pluie.png";
      case "11":
        return "/IMAGE/orage.png";
      case "13":
        return "/IMAGE/neige.png";
      case "50":
        return "/IMAGE/vent.png";
      default:
        return "/IMAGE/Nuageux.png";
    }
  }

  function getWeatherLabel(icon: string) {
    if (!icon) return "";
    const code = icon.substring(0, 2);
    switch (code) {
      case "01":
        return "Ensoleillé ☀️";
      case "02":
        return "Partiellement nuageux 🌤";
      case "03":
      case "04":
        return "Nuageux ☁️";
      case "09":
      case "10":
        return "Pluvieux 🌧";
      case "11":
        return "Orageux ⛈";
      case "13":
        return "Neigeux ❄️";
      case "50":
        return "Brumeux 🌫";
      default:
        return "";
    }
  }

  function rechercherMeteo() {
    if (!ville.trim()) return;
    setVilleRecherchee(ville.trim());
  }

  function randomItem<T>(liste: T[]) {
    if (!liste.length) return null;
    return liste[Math.floor(Math.random() * liste.length)];
  }

  function filtrerVetementsIntelligents(
    liste: Vetement[],
    categorieActuelle: Categorie
  ) {
    const saisonMeteo = getSaisonDepuisMeteo();
    let resultat = liste.filter((item) => item.usages.includes(usageChoisi));

    const parHumeur = resultat.filter((item) =>
      item.humeurs ? item.humeurs.includes(humeur) : true
    );
    if (parHumeur.length > 0) resultat = parHumeur;

    const parSaison = resultat.filter((item) =>
      item.saisons ? item.saisons.includes(saisonMeteo) : true
    );
    if (parSaison.length > 0) resultat = parSaison;

    if (meteoType === "pluie" && categorieActuelle === "chaussures") {
      const pluie = resultat.filter(
        (item) =>
          item.nom.toLowerCase().includes("bott") ||
          item.nom.toLowerCase().includes("basket")
      );
      if (pluie.length > 0) resultat = pluie;
    }
    if (meteoType === "pluie" && categorieActuelle === "accessoires") {
      const pluie = resultat.filter((item) =>
        item.nom.toLowerCase().includes("parapluie")
      );
      if (pluie.length > 0) resultat = pluie;
    }
    if (meteoType === "froid" && categorieActuelle === "haut") {
      const froid = resultat.filter(
        (item) =>
          item.nom.toLowerCase().includes("pull") ||
          item.nom.toLowerCase().includes("blazer") ||
          item.nom.toLowerCase().includes("veste")
      );
      if (froid.length > 0) resultat = froid;
    }
    if (meteoType === "froid" && categorieActuelle === "accessoires") {
      const froid = resultat.filter(
        (item) =>
          item.nom.toLowerCase().includes("écharpe") ||
          item.nom.toLowerCase().includes("echarpe")
      );
      if (froid.length > 0) resultat = froid;
    }
    if (meteoType === "soleil" && categorieActuelle === "chaussures") {
      const soleil = resultat.filter(
        (item) =>
          item.nom.toLowerCase().includes("sandale") ||
          item.nom.toLowerCase().includes("mocassin") ||
          item.nom.toLowerCase().includes("talon")
      );
      if (soleil.length > 0) resultat = soleil;
    }
    if (meteoType === "soleil" && categorieActuelle === "accessoires") {
      const soleil = resultat.filter(
        (item) =>
          item.nom.toLowerCase().includes("lunettes") ||
          item.nom.toLowerCase().includes("casquette")
      );
      if (soleil.length > 0) resultat = soleil;
    }
    if (meteoType === "nuageux" && categorieActuelle === "haut") {
      const nuageux = resultat.filter(
        (item) =>
          item.nom.toLowerCase().includes("blazer") ||
          item.nom.toLowerCase().includes("pull") ||
          item.nom.toLowerCase().includes("blouse")
      );
      if (nuageux.length > 0) resultat = nuageux;
    }

    return resultat;
  }

  function choisirVetementBiblio(categorieRecherchee: Categorie) {
    const saisonMeteo = getSaisonDepuisMeteo();

    const filtres = bibliothequeVetements.filter((v) => {
      const saisons = v.saisons?.length
        ? v.saisons
        : v.saison
        ? [v.saison]
        : [];
      const usages = v.usages?.length ? v.usages : v.usage ? [v.usage] : [];
      const humeurs = v.humeurs?.length
        ? v.humeurs
        : v.humeur
        ? [v.humeur]
        : [];

      const categorieOK = v.categorie === categorieRecherchee;
      const usageOK = usages.length === 0 || usages.includes(usageChoisi);
      const saisonOK =
        saisons.length === 0 ||
        saisons.includes(saisonMeteo) ||
        saisons.includes("mi");
      const humeurOK = humeurs.length === 0 || humeurs.includes(humeur);

      return categorieOK && usageOK && saisonOK && humeurOK;
    });

    if (filtres.length > 0) return randomItem(filtres);
    return null;
  }

  const tenueAssistant = useMemo(() => {
    refresh;

    const hautBiblio = choisirVetementBiblio("haut");
    const basBiblio = choisirVetementBiblio("bas");
    const chaussuresBiblio = choisirVetementBiblio("chaussures");
    const accessoiresBiblio = choisirVetementBiblio("accessoires");

    return {
      haut:
        hautBiblio ||
        randomItem(filtrerVetementsIntelligents(vetements.haut, "haut")),
      bas:
        basBiblio ||
        randomItem(filtrerVetementsIntelligents(vetements.bas, "bas")),
      chaussures:
        chaussuresBiblio ||
        randomItem(
          filtrerVetementsIntelligents(vetements.chaussures, "chaussures")
        ),
      accessoires:
        accessoiresBiblio ||
        randomItem(
          filtrerVetementsIntelligents(vetements.accessoires, "accessoires")
        ),
    };
  }, [
    refresh,
    humeur,
    usageChoisi,
    meteo?.description,
    meteo?.temperature,
    vetements,
    bibliothequeVetements,
  ]);

  useEffect(() => {
    const fetchMeteo = async () => {
      try {
        setErreurMeteo("");
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${villeRecherchee},fr&appid=f7ad154621775e3685357f257e5d6b49&units=metric&lang=fr`
        );
        const data = await response.json();
        if (data.cod === 200 || data.cod === "200") {
          setMeteo({
            temperature: Math.round(data.main.temp),
            description: data.weather[0].description,
            ville: data.name,
            icon: data.weather[0].icon,
          });
        } else {
          setMeteo(null);
          setErreurMeteo("Ville introuvable");
        }
      } catch (error) {
        console.error("Erreur météo :", error);
        setMeteo(null);
        setErreurMeteo("Erreur lors du chargement");
      }
    };
    if (villeRecherchee.trim() !== "") fetchMeteo();
  }, [villeRecherchee]);

  useEffect(() => {
    localStorage.setItem(
      "bibliothequeVetements",
      JSON.stringify(bibliothequeVetements)
    );
  }, [bibliothequeVetements]);

  const enregistrerVetement = async () => {
    if (!nomVetement.trim()) {
      alert("Ajoute un nom de vêtement");
      return;
    }
    if (
      saisonsVetement.length === 0 ||
      usagesVetement.length === 0 ||
      humeursVetement.length === 0
    ) {
      alert("Choisis au moins une saison, un usage et une humeur");
      return;
    }

    let imageUrl: string | null = null;

    if (image) {
      const response = await fetch(image);
      const blob = await response.blob();
      const extension = blob.type.includes("png") ? "png" : "jpg";
      const fileName = `public/${Date.now()}-${nomVetement
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-_]/g, "")
        .toLowerCase()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("vetements")
        .upload(fileName, blob, {
          contentType: blob.type || "image/png",
          upsert: false,
        });

      if (uploadError) {
        console.error("UPLOAD ERROR FULL:", uploadError);
        alert(`Erreur upload image : ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage
        .from("vetements")
        .getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("vetements").insert([
      {
        nom: nomVetement.trim(),
        categorie,
        saisons: saisonsVetement,
        usages: usagesVetement,
        humeurs: humeursVetement,
        image_url: imageUrl,
      },
    ]);

    if (error) {
      console.error("INSERT ERROR FULL:", error);
      alert(`Erreur enregistrement : ${error.message}`);
      return;
    }

    await chargerVetements();

    alert("Vêtement enregistré !");
    resetAjouterVetement();
  };

  const supprimerVetement = async (id: number) => {
    const { error } = await supabase.from("vetements").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Erreur suppression");
      return;
    }
    setBibliothequeVetements((prev) => prev.filter((item) => item.id !== id));
  };

  const getVetementsParCategorie = (cat: "haut" | "bas" | "chaussures") => {
    return bibliothequeVetements.filter((v) => v.categorie === cat);
  };

  const nettoyerNomVetement = (nom?: string) => {
    if (!nom) return "";
    return nom
      .replace(/[👚🧥👕🧶✨👖🖤🤎🩳👗🥿👠👟🩴🥾👜⌚🧢🎒💎🧣🕶☔]/gu, "")
      .trim();
  };

  const formatListe = (
    liste?: string[] | string | null,
    fallback?: string | null
  ) => {
    if (Array.isArray(liste) && liste.length > 0) {
      return liste.join(" • ");
    }

    if (typeof liste === "string" && liste.trim() !== "") {
      return liste;
    }

    return fallback || "";
  };

  const getImageVetement = (vetement: any) => {
    return vetement?.image || vetement?.image_url || null;
  };

  const enregistrerTenueSupabase = async (tenue: {
    haut: any;
    bas: any;
    chaussures: any;
    accessoires: any;
  }) => {
    const nouvelleTenue = {
      date: new Date().toLocaleDateString(),
      usage: usageChoisi,
      humeur: humeur,
      ville: meteo?.ville || "",
      meteo_label: meteo?.icon ? getWeatherLabel(meteo.icon) : "",
      haut_image: getImageVetement(tenue.haut),
      bas_image: getImageVetement(tenue.bas),
      chaussures_image: getImageVetement(tenue.chaussures),
      accessoires_image: getImageVetement(tenue.accessoires),
      haut_nom: tenue.haut?.nom || "",
      bas_nom: tenue.bas?.nom || "",
      chaussures_nom: tenue.chaussures?.nom || "",
      accessoires_nom: tenue.accessoires?.nom || "",
    };

    console.log("TENUE ENVOYÉE À SUPABASE :", nouvelleTenue);

    const { data, error } = await supabase
      .from("tenues")
      .insert([nouvelleTenue])
      .select();

    if (error) {
      console.error("Erreur Supabase :", error);
      alert("Erreur pendant l'enregistrement : " + error.message);
      return;
    }

    if (data?.[0]) {
      setTenuesValidees((prev) => [data[0], ...prev]);
    } else {
      await chargerTenues();
    }

    alert("Tenue enregistrée 👍");
    setPage("tenues");
  };

  if (!profil) {
    return (
      <div style={screen}>
        <div style={pageWrap}>
          <h1 style={assistantTitle}>Bienvenue sur Dressynk ✨</h1>

          <p style={assistantSubtitle}>
            Crée ton profil pour personnaliser ton expérience.
          </p>

          <input
            placeholder="Prénom"
            value={prenomProfil}
            onChange={(e) => setPrenomProfil(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Nom"
            value={nomProfil}
            onChange={(e) => setNomProfil(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Ville"
            value={villeProfil}
            onChange={(e) => setVilleProfil(e.target.value)}
            style={inputStyle}
          />

          <button onClick={enregistrerProfil} style={homeMainButton}>
            Commencer ✨
          </button>
        </div>
      </div>
    );
  }

  if (page === "accueil") {
    return (
      <div style={screen}>
        <div style={pageWrap}>
          <h1 style={{ ...title, textAlign: "center", marginBottom: 20 }}>
            Bonjour Laura 👋
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem("profilUtilisateur");
              setProfil(null);
            }}
            style={{
              ...secondaryButton,
              marginBottom: 18,
            }}
          >
            Modifier mon profil
          </button>
          <div style={meteoCard}>
            <div style={meteoCardTitle}>🌤 Météo</div>
            <div style={meteoSearchRow}>
              <input
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Entre ta ville"
                style={inputVille}
              />
              <button onClick={rechercherMeteo} style={smallAccentButton}>
                Valider
              </button>
            </div>
            {erreurMeteo && <p style={errorText}>{erreurMeteo}</p>}
            {meteo && !erreurMeteo && (
              <div style={meteoInfoBox}>
                <img
                  src={getWeatherImage(meteo.icon)}
                  alt="meteo"
                  style={weatherImage}
                />
                <div style={meteoVille}>{meteo.ville}</div>
                <div style={meteoTemp}>{meteo.temperature}°C</div>
                <div style={meteoLabel}>{getWeatherLabel(meteo.icon)}</div>
              </div>
            )}
          </div>

          <div style={humeurBox}>
            <div style={humeurTitle}>Humeur à sélectionner</div>
            <div style={humeurSub}>
              Choisis ton humeur pour affiner les tenues proposées
            </div>
            <div style={humeurGrid}>
              {HUMEURS.map((item) => (
                <button
                  key={item.key}
                  style={humeurBtn(humeur === item.key)}
                  onClick={() => setHumeur(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <p style={homeSectionTitle}>Choisis ton style du jour ✨</p>
          <div style={usageGrid}>
            <div
              style={usageCard(usageChoisi === "travail")}
              onClick={() => setUsageChoisi("travail")}
            >
              <div style={emoji}>👔</div>Travail
            </div>
            <div
              style={usageCard(usageChoisi === "detente")}
              onClick={() => setUsageChoisi("detente")}
            >
              <div style={emoji}>👟</div>Détente
            </div>
            <div
              style={usageCard(usageChoisi === "sortie")}
              onClick={() => setUsageChoisi("sortie")}
            >
              <div style={emoji}>👗</div>Sortie
            </div>
          </div>

          <div style={assistantCreationRow}>
            <div
              style={assistantBox}
              onClick={() => {
                setRefresh((prev) => prev + 1);
                setPage("assistant");
              }}
            >
              <div style={{ fontSize: 30 }}>✨</div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>Styliste IA</div>
              <div style={assistantBoxSub}>
                Je choisis pour toi selon humeur + météo
              </div>
            </div>
            <div style={creationBox} onClick={() => setPage("creation")}>
              <div style={{ fontSize: 30 }}>🛠</div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>
                Créer soi-même
              </div>
              <div style={assistantBoxSub}>Compose ta tenue</div>
            </div>
          </div>

          <div style={homeBottomButtons}>
            <button
              onClick={() => {
                resetAjouterVetement();
                setPage("ajouter");
              }}
              style={homeMainButton}
            >
              Ajouter un vêtement
            </button>
            <button
              onClick={() => setPage("bibliotheque")}
              style={homeMainButton}
            >
              Ma bibliothèque
            </button>
            <button onClick={() => setPage("tenues")} style={homeMainButton}>
              Mes tenues
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (page === "assistant") {
    const tenueActuelle: TenueValidee = {
      haut: tenueAssistant.haut,
      bas: tenueAssistant.bas,
      chaussures: tenueAssistant.chaussures,
      accessoires: tenueAssistant.accessoires,
      date: new Date().toLocaleDateString(),
      usage: usageChoisi,
      humeur,
      ville: meteo?.ville,
      meteoLabel: meteo?.icon ? getWeatherLabel(meteo.icon) : "",
    };

    return (
      <div style={screen}>
        <div style={pageWrap}>
          <h2 style={assistantTitle}>Mon styliste IA ✨</h2>

          <p style={assistantSubtitle}>
            {usageChoisi === "travail" &&
              "Tenue idéale pour une journée de travail 💼"}
            {usageChoisi === "detente" &&
              "Look détente parfait pour aujourd’hui ✨"}
            {usageChoisi === "sortie" && "Style élégant pour ta sortie 👗"}
            {humeur === "motivee" && " • Tu vas tout déchirer aujourd’hui 💪"}
            {humeur === "cocooning" && " • Confort et douceur au programme 🧸"}
            {humeur === "elegante" && " • Une touche chic parfaite ✨"}
          </p>

          <div style={assistantInfoBox}>
            <div style={assistantInfoLine}>
              <strong>Humeur :</strong>{" "}
              {HUMEURS.find((h) => h.key === humeur)?.label}
            </div>

            <div style={assistantInfoLine}>
              <strong>Météo :</strong>{" "}
              {meteo
                ? `${meteo.temperature}°C • ${getWeatherLabel(meteo.icon)}`
                : "Non renseignée"}
            </div>
          </div>

          <div
            style={{ opacity: fade ? 1 : 0, transition: "opacity 0.2s ease" }}
          >
            <div style={assistantPreviewCard}>
              <h3 style={assistantPreviewTitle}>Aperçu tenue</h3>

              {(
                ["haut", "bas", "chaussures", "accessoires"] as Categorie[]
              ).map((cat) => {
                const vetement = tenueAssistant[cat];

                return (
                  <div key={cat} style={assistantPreviewSlot}>
                    {vetement?.image ? (
                      <>
                        <img
                          src={vetement.image}
                          alt={vetement.nom}
                          style={{
                            maxWidth: "85px",
                            maxHeight: "85px",
                            objectFit: "contain",
                            display: "block",
                            margin: "0 auto",
                          }}
                        />

                        <p style={assistantPreviewName}>
                          {nettoyerNomVetement(vetement.nom)}
                        </p>
                      </>
                    ) : (
                      <p style={assistantPreviewEmpty}>{cat}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              style={fullMainButton}
              onClick={() =>
                enregistrerTenueSupabase({
                  haut: tenueActuelle.haut,
                  bas: tenueActuelle.bas,
                  chaussures: tenueActuelle.chaussures,
                  accessoires: tenueActuelle.accessoires,
                })
              }
            >
              👍 Je porte cette tenue
            </button>
          </div>

          <button
            style={{ ...secondaryButton, marginTop: 50 }}
            onClick={() => {
              setFade(false);

              setTimeout(() => {
                setRefresh((prev) => prev + 1);
                setFade(true);
              }, 150);
            }}
          >
            🔄 Autre proposition
          </button>

          <button
            style={{ ...ghostWideButton, marginTop: 12 }}
            onClick={() => setPage("accueil")}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  if (page === "ajouter") {
    return (
      <div style={screen}>
        <div style={pageWrapNarrow}>
          <h2 style={{ ...title, textAlign: "center", marginTop: 5 }}>
            Ajouter un vêtement
          </h2>
          <p style={{ ...subtitle, textAlign: "center", marginBottom: 20 }}>
            Ajoute tes vêtements et crée des tenues parfaites
          </p>

          <input
            type="text"
            value={nomVetement}
            onChange={(e) => setNomVetement(e.target.value)}
            placeholder="Nom du vêtement"
            style={textInput}
          />

          <div
            style={uploadBox}
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
            {image ? (
              <img
                src={image}
                alt="photo importée"
                style={{
                  width: 170,
                  height: 170,
                  borderRadius: 16,
                  objectFit: "contain",
                  background: "white",
                }}
              />
            ) : (
              <>
                <img
                  src="/IMAGE/Camera.png"
                  alt="camera"
                  style={{ width: 190, height: 120, objectFit: "contain" }}
                />
                <p
                  style={{ marginTop: 10, textAlign: "center", color: C.text }}
                >
                  Prendre une photo ou importer depuis la galerie
                </p>
              </>
            )}
          </div>

          {image && (
            <>
              <button
                style={{ ...fullMainButton, marginTop: -10, marginBottom: 10 }}
                onClick={nettoyerVetement}
              >
                ✨ Nettoyer le vêtement
              </button>

              <p
                style={{ textAlign: "center", fontSize: 12, color: "#8c6e60" }}
              >
                (peut ne pas fonctionner dans CodeSandbox)
              </p>
            </>
          )}
          <p style={sectionTitle}>Type de vêtement</p>
          <div style={rowButtons}>
            <button
              style={toggleBtn(categorie === "haut")}
              onClick={() => setCategorie("haut")}
            >
              👚 Haut
            </button>
            <button
              style={toggleBtn(categorie === "bas")}
              onClick={() => setCategorie("bas")}
            >
              👖 Bas
            </button>
            <button
              style={toggleBtn(categorie === "chaussures")}
              onClick={() => setCategorie("chaussures")}
            >
              👠 Chaussures
            </button>
            <button
              style={toggleBtn(categorie === "accessoires")}
              onClick={() => setCategorie("accessoires")}
            >
              👜 Accessoires
            </button>
          </div>

          <p style={sectionTitle}>Saison</p>
          <div style={rowButtons}>
            <button
              style={toggleBtn(saisonsVetement.includes("ete"))}
              onClick={() => toggleSaisonVetement("ete")}
            >
              ☀️ Été
            </button>
            <button
              style={toggleBtn(saisonsVetement.includes("hiver"))}
              onClick={() => toggleSaisonVetement("hiver")}
            >
              ❄️ Hiver
            </button>
            <button
              style={toggleBtn(saisonsVetement.includes("mi"))}
              onClick={() => toggleSaisonVetement("mi")}
            >
              🍂 Mi-saison
            </button>
          </div>

          <p style={sectionTitle}>Usage</p>
          <div style={rowButtons}>
            <button
              style={toggleBtn(usagesVetement.includes("travail"))}
              onClick={() => toggleUsageVetement("travail")}
            >
              💼 Travail
            </button>
            <button
              style={toggleBtn(usagesVetement.includes("detente"))}
              onClick={() => toggleUsageVetement("detente")}
            >
              👟 Détente
            </button>
            <button
              style={toggleBtn(usagesVetement.includes("sortie"))}
              onClick={() => toggleUsageVetement("sortie")}
            >
              👗 Sortie
            </button>
          </div>

          <p style={sectionTitle}>Humeur</p>
          <div style={rowButtons}>
            {HUMEURS_AJOUT.map((h) => (
              <button
                key={h.id}
                style={toggleBtn(humeursVetement.includes(h.id))}
                onClick={() => toggleHumeurVetement(h.id)}
              >
                {h.label}
              </button>
            ))}
          </div>

          <button
            style={{ ...fullMainButton, marginTop: 12 }}
            onClick={enregistrerVetement}
          >
            Enregistrer le vêtement
          </button>
          <button
            style={{ ...ghostWideButton, marginTop: 14 }}
            onClick={() => {
              resetAjouterVetement();
              setPage("accueil");
            }}
          >
            ⬅ Retour
          </button>
        </div>
      </div>
    );
  }

  if (page === "bibliotheque") {
    return (
      <div style={screen}>
        <div style={pageWrap}>
          <h1 style={{ ...title, textAlign: "center", marginBottom: 18 }}>
            Ma bibliothèque 👗
          </h1>
          {bibliothequeVetements.length === 0 ? (
            <p style={emptyText}>Aucun vêtement enregistré pour le moment.</p>
          ) : (
            <div style={{ display: "grid", gap: 18, marginTop: 20 }}>
              {bibliothequeVetements.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#fffaf6",
                    borderRadius: 24,
                    padding: 12,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(0,0,0,0.05)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.nom}
                      style={{
                        width: "100%",
                        height: 200,
                        objectFit: "contain",
                        background: "white",
                        borderRadius: 16,
                        display: "block",
                        marginBottom: 12,
                      }}
                    />
                  )}
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      letterSpacing: 0.4,
                      color: "#2c2018",
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    {item.nom || "Vêtement sans nom"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 4,
                      marginBottom: 14,
                    }}
                  >
                    <span style={badgeStyle}>{item.categorie}</span>
                    {formatListe(item.saisons, item.saison) && (
                      <span style={badgeStyle}>
                        {formatListe(item.saisons, item.saison)}
                      </span>
                    )}
                    {formatListe(item.usages, item.usage) && (
                      <span style={badgeStyle}>
                        {formatListe(item.usages, item.usage)}
                      </span>
                    )}
                    {formatListe(item.humeurs, item.humeur) && (
                      <span style={badgeStyle}>
                        {formatListe(item.humeurs, item.humeur)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => supprimerVetement(item.id)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 14,
                      border: "1px solid #ead7ca",
                      background: "#f7ebe3",
                      color: "#a06f4d",
                      fontWeight: "600",
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            style={{ ...ghostWideButton, marginTop: 22 }}
            onClick={() => setPage("accueil")}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  if (page === "creation") {
    return (
      <div style={screen}>
        <div style={pageWrapLarge}>
          <h2 style={assistantTitle}>Créer ma tenue</h2>
          <p style={assistantSubtitle}>Compose ton look pièce par pièce</p>

          <div style={creationGrid}>
            <div style={previewCard}>
              <h3 style={{ textAlign: "center", color: C.text }}>
                Aperçu tenue
              </h3>

              {(
                ["haut", "bas", "chaussures", "accessoires"] as Categorie[]
              ).map((cat) => (
                <div key={cat} style={previewItem}>
                  {tenueCreee[cat] && (
                    <button
                      onClick={() =>
                        setTenueCreee((prev) => ({
                          ...prev,
                          [cat]: null,
                        }))
                      }
                      style={deletePreviewBtn}
                    >
                      ✕
                    </button>
                  )}

                  {tenueCreee[cat]?.image ? (
                    <img
                      src={tenueCreee[cat]?.image || ""}
                      alt={tenueCreee[cat]?.nom}
                      style={{
                        maxWidth: "100%",
                        maxHeight: 95,
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <span style={{ color: C.muted, fontSize: 14 }}>{cat}</span>
                  )}

                  {tenueCreee[cat]?.nom && (
                    <small style={{ color: C.text, marginTop: 6 }}>
                      {tenueCreee[cat]?.nom}
                    </small>
                  )}
                </div>
              ))}
            </div>

            <div style={choicePanel}>
              {(
                ["haut", "bas", "chaussures", "accessoires"] as Categorie[]
              ).map((cat) => (
                <button
                  key={cat}
                  style={chooseBtnLarge}
                  onClick={() => {
                    setCategorieSelectionnee(cat);
                    setPage("selectionVetement");
                  }}
                >
                  <span style={plusCircle}>＋</span>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}

              <button
                style={{ ...mainButton, marginTop: 20, width: "100%" }}
                onClick={() =>
                  enregistrerTenueSupabase({
                    haut: tenueCreee.haut,
                    bas: tenueCreee.bas,
                    chaussures: tenueCreee.chaussures,
                    accessoires: tenueCreee.accessoires,
                  })
                }
              >
                Valider ma tenue
              </button>

              <button
                style={{ ...ghostWideButton, marginTop: 15 }}
                onClick={() => setPage("accueil")}
              >
                ← Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (page === "selectionVetement") {
    const vetementsFiltres = categorieSelectionnee
      ? bibliothequeVetements.filter(
          (v) => v.categorie === categorieSelectionnee
        )
      : [];

    const choisirVetement = (vetement: VetementBiblio) => {
      setTenueCreee((prev) => ({
        ...prev,
        [vetement.categorie]: vetement,
      }));

      setPage("creation");
    };

    return (
      <div style={screen}>
        <div style={pageWrapLarge}>
          <h2 style={assistantTitle}>Ma bibliothèque</h2>
          <p style={assistantSubtitle}>
            Choisis ton vêtement : {categorieSelectionnee}
          </p>

          <div style={libraryGrid}>
            {vetementsFiltres.map((vetement) => (
              <button
                key={vetement.id}
                onClick={() => choisirVetement(vetement)}
                style={libraryCard}
              >
                {vetement.image && (
                  <img
                    src={vetement.image}
                    alt={vetement.nom}
                    style={{
                      width: "100%",
                      height: 150,
                      objectFit: "contain",
                    }}
                  />
                )}

                <p style={{ color: C.text, fontWeight: 600 }}>{vetement.nom}</p>
              </button>
            ))}
          </div>

          <button
            style={{ ...ghostWideButton, marginTop: 25 }}
            onClick={() => setPage("creation")}
          >
            ← Retour à ma tenue
          </button>
        </div>
      </div>
    );
  }

  if (page === "tenues") {
    return (
      <div style={screen}>
        <div style={pageWrapLarge}>
          <h2 style={assistantTitle}>Mes tenues</h2>

          {tenuesValidees.length === 0 ? (
            <p style={{ color: C.muted }}>Aucune tenue enregistrée</p>
          ) : (
            <div style={libraryGrid}>
              {tenuesValidees.map((tenue) => {
                const robe = tenue.haut_nom?.toLowerCase().includes("robe");

                return (
                  <div key={tenue.id} style={libraryCard}>
                    {robe ? (
                      tenue.haut_image && (
                        <img
                          src={tenue.haut_image}
                          alt={tenue.haut_nom || "Robe"}
                          style={{
                            width: "100%",
                            height: 200,
                            objectFit: "contain",
                          }}
                        />
                      )
                    ) : (
                      <>
                        {tenue.haut_image && (
                          <img
                            src={tenue.haut_image}
                            alt={tenue.haut_nom || "Haut"}
                            style={{
                              width: "100%",
                              height: 200,
                              objectFit: "contain",
                            }}
                          />
                        )}

                        {tenue.bas_image && (
                          <img
                            src={tenue.bas_image}
                            alt={tenue.bas_nom || "Bas"}
                            style={{
                              width: "100%",
                              height: 200,
                              objectFit: "contain",
                            }}
                          />
                        )}
                      </>
                    )}

                    {tenue.chaussures_image && (
                      <img
                        src={tenue.chaussures_image}
                        alt={tenue.chaussures_nom || "Chaussures"}
                        style={{
                          width: "100%",
                          height: 200,
                          objectFit: "contain",
                        }}
                      />
                    )}

                    {tenue.accessoires_image && (
                      <img
                        src={tenue.accessoires_image}
                        alt={tenue.accessoires_nom || "Accessoire"}
                        style={{
                          width: "100%",
                          height: 200,
                          objectFit: "contain",
                        }}
                      />
                    )}

                    <p style={{ marginTop: 10 }}>{tenue.date}</p>

                    <button
                      onClick={() => supprimerTenue(tenue.id)}
                      style={{
                        display: "block",
                        marginTop: 20,
                        width: "100%",
                        padding: "12px",
                        borderRadius: 12,
                        border: "none",
                        background: "#c0392b",
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                        position: "relative",
                        zIndex: 10,
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            style={{ ...ghostWideButton, marginTop: 20 }}
            onClick={() => setPage("accueil")}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return null;
}
const screen = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  justifyContent: "center",
  background: C.bg,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  padding: "20px 0",
  boxSizing: "border-box" as const,
};

const pageWrap = {
  width: "100%",
  maxWidth: 1100,
  margin: "0 auto",
  padding: "24px 40px",
  boxSizing: "border-box" as const,
};

const pageWrapNarrow = {
  width: "92%",
  maxWidth: 430,
  display: "flex",
  flexDirection: "column" as const,
  boxSizing: "border-box" as const,
};

const creationGrid = {
  display: "grid",
  gridTemplateColumns: "300px 1fr",
  gap: 30,
  marginTop: 20,
};

const previewCard = {
  background: "rgba(255,255,255,0.82)",
  border: `1.5px solid ${C.accent}`,
  borderRadius: 28,
  padding: 20,
  boxShadow: "0 12px 25px rgba(0,0,0,0.08)",
};

const previewItem = {
  position: "relative" as const,
  minHeight: 115,
  marginBottom: 14,
  borderRadius: 20,
  background: "#fffaf6",
  border: "1px dashed #d8a17b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column" as const,
  padding: 10,
};

const deletePreviewBtn = {
  position: "absolute" as const,
  top: 8,
  right: 8,
  width: 24,
  height: 24,
  borderRadius: "50%",
  border: "none",
  background: "#d98b73",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
};

const choicePanel = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 18,
};

const chooseBtnLarge = {
  width: "100%",
  minHeight: 95,
  padding: "20px 26px",
  borderRadius: 26,
  border: `1.5px solid ${C.accent}`,
  background: "rgba(255,255,255,0.86)",
  display: "flex",
  alignItems: "center",
  gap: 20,
  fontSize: 18,
  color: C.text,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
};

const libraryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 18,
  marginTop: 30,
};

const libraryCard = {
  border: `1.5px solid ${C.accent}`,
  borderRadius: 22,
  background: "rgba(255,255,255,0.88)",
  padding: 14,
  cursor: "pointer",
};

const title = {
  color: C.text,
  fontSize: 42,
  fontWeight: "700",
  marginBottom: 6,
  lineHeight: 1.1,
};
const subtitle = {
  color: C.muted,
  marginBottom: 28,
  fontSize: 18,
  lineHeight: 1.4,
};
const meteoCard = {
  background: "linear-gradient(135deg, #cfe8f7, #b7d8ee)",
  borderRadius: 28,
  padding: "22px 20px",
  width: "100%",
  margin: "0 auto 22px auto",
  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
  textAlign: "center" as const,
  boxSizing: "border-box" as const,
};
const meteoCardTitle = {
  fontSize: 28,
  fontWeight: 700,
  color: C.text,
  marginBottom: 12,
};
const meteoSearchRow = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap" as const,
  marginBottom: 14,
};
const inputVille = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #c7d7e2",
  fontSize: 15,
  width: 180,
  outline: "none",
};
const smallAccentButton = {
  background: C.accent,
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "10px 16px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};
const errorText = {
  color: "#d14b4b",
  fontWeight: 600,
  marginTop: 8,
  marginBottom: 0,
};
const meteoInfoBox = {
  marginTop: 14,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: 6,
};
const weatherImage = { width: 90, height: 90, objectFit: "contain" as const };
const meteoVille = { fontSize: 20, fontWeight: 700, color: C.text };
const meteoTemp = {
  fontSize: 30,
  fontWeight: 800,
  color: C.text,
  lineHeight: 1,
};
const meteoLabel = {
  fontSize: 15,
  color: "#6b5b52",
  textTransform: "capitalize" as const,
};
const humeurBox = {
  background: "#efe3db",
  border: "2px solid #d8b9a8",
  borderRadius: 28,
  padding: "22px 20px",
  width: "100%",
  boxSizing: "border-box" as const,
  margin: "0 auto 22px auto",
};
const humeurTitle = {
  fontSize: 20,
  fontWeight: 700,
  color: "#3d3d3d",
  marginBottom: 14,
  textAlign: "center" as const,
};
const humeurSub = {
  fontSize: 15,
  color: "#6b6b6b",
  textAlign: "center" as const,
  marginBottom: 18,
};
const humeurGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 12,
};
const humeurBtn = (active: boolean) => ({
  padding: "14px 10px",
  borderRadius: 22,
  border: active ? `2px solid ${C.accent}` : "2px solid #e8ddd6",
  background: active ? C.accent : "#f5ebe5",
  color: active ? "#fff" : C.text,
  fontSize: 16,
  fontWeight: 500,
  cursor: "pointer",
});
const homeSectionTitle = {
  width: "100%",
  textAlign: "center" as const,
  fontSize: 22,
  fontWeight: 700,
  color: "#9b7563",
  marginTop: 8,
  marginBottom: 18,
};
const usageGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 14,
  width: "100%",
};
const usageCard = (active: boolean) => ({
  background: active ? "#d9d1cb" : "rgba(255,255,255,0.88)",
  opacity: active ? 1 : 0.95,
  border: active ? `2px solid ${C.accent}` : "none",
  transform: active ? "scale(0.98)" : "scale(1)",
  transition: "all 0.2s ease",
  textAlign: "center" as const,
  padding: 20,
  borderRadius: 20,
  cursor: "pointer",
  boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
});
const emoji = { fontSize: 35, marginBottom: 8 };
const assistantCreationRow = {
  display: "flex",
  justifyContent: "center",
  alignItems: "stretch",
  gap: 15,
  flexWrap: "wrap" as const,
  marginTop: 26,
  width: "100%",
};
const assistantBox = {
  flex: 1,
  background: "linear-gradient(135deg,#e8d5c4,#d6b8a5)",
  borderRadius: 20,
  padding: 18,
  cursor: "pointer",
  boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
  textAlign: "center" as const,
  minHeight: 125,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  boxSizing: "border-box" as const,
};
const creationBox = {
  flex: 1,
  background: "linear-gradient(135deg,#f5e6df,#ead2c5)",
  borderRadius: 20,
  padding: 18,
  cursor: "pointer",
  boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
  textAlign: "center" as const,
  minHeight: 125,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  boxSizing: "border-box" as const,
};
const assistantBoxSub = { fontSize: 13, color: "#6e6e6e", marginTop: 5 };
const homeBottomButtons = {
  display: "flex",
  justifyContent: "center",
  gap: 16,
  marginTop: 55,
  flexWrap: "wrap" as const,
  width: "100%",
};
const homeMainButton = {
  background: C.accent,
  color: "white",
  border: "none",
  borderRadius: 18,
  padding: "14px 22px",
  fontSize: 18,
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
  width: 240,
};
const assistantTitle = {
  color: C.text,
  fontSize: 34,
  marginTop: 0,
  marginBottom: 10,
  lineHeight: 1.1,
  textAlign: "center" as const,
};
const assistantSubtitle = {
  color: C.muted,
  fontSize: 18,
  marginTop: 0,
  marginBottom: 18,
  lineHeight: 1.4,
  textAlign: "center" as const,
};
const assistantInfoBox = {
  marginTop: 12,
  marginBottom: 20,
  background: "#fff4ed",
  border: "1px solid #ecd3c3",
  borderRadius: 18,
  padding: "14px 16px",
  boxSizing: "border-box" as const,
};
const assistantInfoLine = { fontSize: 15, color: "#5f4a3d", marginTop: 6 };
const textInput = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid #d8c2b5",
  fontSize: 16,
  marginBottom: 20,
  outline: "none",
  boxSizing: "border-box" as const,
};
const uploadBox = {
  width: "100%",
  minHeight: 190,
  border: "1.5px dashed #d7a989",
  borderRadius: 20,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.25)",
  padding: "20px",
  boxSizing: "border-box" as const,
  marginBottom: 25,
  cursor: "pointer",
};
const sectionTitle = {
  color: "#5c4a42",
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 8,
  marginTop: 6,
};
const rowButtons = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 12,
  width: "100%",
  marginTop: 10,
  marginBottom: 20,
};
const btn = {
  flex: "1 1 calc(50% - 6px)",
  padding: "14px 16px",
  borderRadius: 18,
  border: "none",
  background: "#eee",
  color: C.text,
  fontSize: 18,
  fontWeight: "600",
  cursor: "pointer",
  textAlign: "center" as const,
  minHeight: 56,
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box" as const,
};
const toggleBtn = (active: boolean) => ({
  ...btn,
  background: active ? C.accent : "#eee",
  color: active ? "white" : C.text,
});
const fullMainButton = {
  width: "100%",
  padding: "14px",
  borderRadius: 18,
  border: "none",
  background: C.accent,
  color: "white",
  fontWeight: "600",
  fontSize: 18,
  cursor: "pointer",
  boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
};
const secondaryButton = {
  width: "100%",
  padding: "12px",
  borderRadius: 18,
  border: "none",
  background: "#e8ddd4",
  color: "#5c4433",
  fontSize: 15,
  cursor: "pointer",
  marginTop: 12,
};
const ghostWideButton = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 18,
  background: "transparent",
  color: C.accent,
  border: `2px solid ${C.accent}`,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};
const emptyText = {
  textAlign: "center" as const,
  color: C.muted,
  marginTop: 30,
  fontSize: 16,
};
const badgeStyle = {
  background: "#f1e4da",
  padding: "5px 10px",
  borderRadius: 12,
  fontSize: 12,
  color: "#8c6e60",
};
const creationTitle = {
  color: C.text,
  fontSize: 40,
  fontWeight: "700",
  marginTop: 0,
  marginBottom: 12,
  lineHeight: 1.1,
  textAlign: "center" as const,
};
const creationSubtitle = {
  color: C.muted,
  fontSize: 20,
  marginTop: 0,
  marginBottom: 34,
  textAlign: "center" as const,
};
const creationBlock = {
  background: "rgba(255,250,246,0.88)",
  border: `1.5px solid ${C.border}`,
  borderRadius: 26,
  padding: "20px 18px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  textAlign: "left" as const,
};
const creationBlockTitle = {
  fontSize: 28,
  fontWeight: "700",
  color: C.text,
  margin: "0 0 14px 0",
  textAlign: "center" as const,
};
const chooseMainButton = {
  width: "100%",
  background: "transparent",
  border: "none",
  display: "flex",
  alignItems: "center",
  gap: 14,
  fontSize: 18,
  color: "#6b5242",
  cursor: "pointer",
  padding: 0,
  textAlign: "left" as const,
};
const plusCircle = {
  width: 42,
  height: 42,
  minWidth: 42,
  borderRadius: "50%",
  border: `1.5px solid ${C.accent}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  color: C.accent,
  flexShrink: 0,
  padding: "18px",
};

const choiceList = { marginTop: 16, display: "grid", gap: 10 };
const choiceItem = {
  padding: "12px 14px",
  borderRadius: 16,
  border: `1px solid ${C.border}`,
  background: "#fffaf6",
  textAlign: "left" as const,
  cursor: "pointer",
  color: C.text,
  fontSize: 15,
};
const choiceEmpty = { color: C.muted, fontSize: 14 };
const creationValidateButton = {
  background: "linear-gradient(135deg,#c9956a,#b8835d)",
  color: "white",
  border: "none",
  borderRadius: 999,
  padding: "18px 24px",
  fontSize: 20,
  fontWeight: "700",
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
  width: "100%",
  marginTop: 42,
};
const creationBackButton = {
  marginTop: 18,
  width: "100%",
  padding: "12px 18px",
  borderRadius: 999,
  border: `1.5px solid ${C.accent}`,
  background: "rgba(255,250,246,0.55)",
  color: C.accent,
  fontSize: 18,
  fontWeight: "600",
  cursor: "pointer",
};
const mannequinBox = {
  position: "relative" as const,
  width: 280,
  height: 430,
  margin: "22px auto 6px auto",
};
const mannequinSilhouette = {
  position: "absolute" as const,
  left: "50%",
  top: 36,
  transform: "translateX(-50%)",
  width: 92,
  height: 290,
  borderRadius: 60,
  background: "rgba(201,149,106,0.08)",
  border: "1.5px dashed rgba(201,149,106,0.28)",
};
const mannequinHead = {
  position: "absolute" as const,
  left: "50%",
  top: 0,
  transform: "translateX(-50%)",
  width: 46,
  height: 46,
  borderRadius: "50%",
  background: "rgba(201,149,106,0.10)",
  border: "1.5px dashed rgba(201,149,106,0.28)",
};
const mannequinCard = {
  position: "absolute" as const,
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(255,250,246,0.98)",
  border: "1px solid #e6cfc2",
  borderRadius: 18,
  padding: "10px 12px",
  boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
  textAlign: "center" as const,
  width: 124,
  boxSizing: "border-box" as const,
};
const mannequinAccessoire = {
  position: "absolute" as const,
  right: 8,
  top: 128,
  background: "rgba(255,250,246,0.98)",
  border: "1px solid #e6cfc2",
  borderRadius: 16,
  padding: "8px 10px",
  boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
  textAlign: "center" as const,
  width: 108,
  boxSizing: "border-box" as const,
};
const mannequinEmoji = { fontSize: 22, lineHeight: 1, marginBottom: 6 };
const mannequinNom = {
  fontSize: 13,
  color: C.text,
  fontWeight: 600,
  lineHeight: 1.25,
};
const mannequinLigne = {
  position: "absolute" as const,
  left: "50%",
  transform: "translateX(-50%)",
  width: 1,
  background: "rgba(201,149,106,0.20)",
};

const chooseBtn = {
  width: "100%",
  minHeight: 90,
  padding: "18px 24px",
  borderRadius: 24,
  border: `1.5px solid ${C.accent}`,
  background: "rgba(255,255,255,0.82)",
  display: "flex",
  alignItems: "center",
  gap: 18,
  fontSize: 17,
  color: C.text,
  cursor: "pointer",
  marginBottom: 18,
  boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
};

const mainButton = {
  background: C.accent,
  color: "#fff",
  border: "none",
  borderRadius: 30,
  padding: "18px",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
};

const pageWrapLarge = {
  width: "100%",
  maxWidth: 1050,
  margin: "0 auto",
  padding: "24px 40px",
  boxSizing: "border-box" as const,
};

const assistantPreviewCard: React.CSSProperties = {
  width: "250px",
  margin: "20px auto",
  padding: "18px",
  border: "1px solid #c9956a",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.85)",
};

const assistantPreviewTitle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "15px",
  fontWeight: "bold",
};

const assistantPreviewSlot: React.CSSProperties = {
  minHeight: "105px",
  border: "1px dashed #e3a07d",
  borderRadius: "14px",
  marginBottom: "12px",
  padding: "8px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
};

const assistantPreviewName: React.CSSProperties = {
  marginTop: "5px",
  fontSize: "12px",
  textAlign: "center",
};

const assistantPreviewEmpty: React.CSSProperties = {
  fontSize: "12px",
  color: "#9b6b55",
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: `1px solid ${C.border}`,
  marginBottom: 14,
  fontSize: 16,
  boxSizing: "border-box" as const,
};
