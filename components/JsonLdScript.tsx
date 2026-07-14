import { serializeJsonLd } from "@/lib/cinematic/metadata";

export default function JsonLdScript({ value }: { value: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }}
    />
  );
}
