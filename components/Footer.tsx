import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-secondary text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Image
              src="/images/logo-trinkgut-jammers.png"
              alt="Trinkgut Jammers"
              width={160}
              height={63}
              className="h-12 w-auto mb-3 rounded-lg"
            />
            <p className="text-gray-400 text-sm leading-relaxed">
              Mit Leidenschaft für Getränke! Über 7.000 Artikel – von Bier über Wein bis Spirituosen und Softdrinks.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-3">Schnelllinks</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/produkte" className="hover:text-white transition-colors">Alle Produkte</Link></li>
              <li><Link href="/angebote" className="hover:text-white transition-colors">Angebote</Link></li>
              <li><Link href="/partyplaner" className="hover:text-white transition-colors">Partyplaner</Link></li>
              <li><Link href="/vermietung" className="hover:text-white transition-colors">Vermietung</Link></li>
              <li><Link href="/finder" className="hover:text-white transition-colors">Getränke-Finder</Link></li>
              <li><Link href="/cocktails" className="hover:text-white transition-colors">Cocktails</Link></li>
              <li><Link href="/bestellungen" className="hover:text-white transition-colors">Meine Bestellungen</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3">Kontakt</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="font-medium text-white">Trinkgut Jammers Goch e.K.</li>
              <li>Inhaber: Nikolaos Jammers</li>
              <li>Jurgenstr. 20, 47574 Goch</li>
              <li>Tel: <a href="tel:02823418707" className="hover:text-white transition-colors">02823-418707</a></li>
              <li>Handy: <a href="tel:017663228597" className="hover:text-white transition-colors">0176-63228597</a></li>
              <li>E-Mail: <a href="mailto:jammers-goch@trinkgut.de" className="hover:text-white transition-colors">jammers-goch@trinkgut.de</a></li>
              <li className="pt-1">Mo–Sa: 08:00–20:00 Uhr</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="https://www.instagram.com/trinkgutjammers_goch/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.facebook.com/trinkgutjammers" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://wa.me/491752492386" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="WhatsApp">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>

            {/* QR Code */}
            <div className="mt-4 p-3 bg-white rounded-xl inline-block">
              <Image
                src="/images/qr-code.png"
                alt="QR-Code Trinkgut Jammers"
                width={80}
                height={80}
                className="w-20 h-20"
              />
              <p className="text-[10px] text-gray-800 text-center mt-1 font-medium">Scannen & folgen</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Trinkgut Jammers Goch e.K.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
