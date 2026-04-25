import "./globals.css";
export const metadata = {
  title: "Nordic BESS Pro",
  description: "Nordic BESS investment calculator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
