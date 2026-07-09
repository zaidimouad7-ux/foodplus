import "./globals.css";

export const metadata = {
  title: "Food Plus - Depuis 2011",
  description: "Food Plus, votre restaurant de qualité depuis 2011. Commandez les meilleurs plats, sandwichs et burgers avec livraison rapide.",
  openGraph: {
    title: "Food Plus - Depuis 2011",
    description: "Food Plus, votre restaurant de qualité depuis 2011. Commandez les meilleurs plats, sandwichs et burgers avec livraison rapide.",
    siteName: "Food Plus",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Food Plus - Depuis 2011",
    description: "Food Plus, votre restaurant de qualité depuis 2011. Commandez les meilleurs plats, sandwichs et burgers avec livraison rapide.",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}