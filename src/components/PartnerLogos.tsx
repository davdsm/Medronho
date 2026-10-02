import { partners } from "../data";

export function PartnerLogos() {
  return (
    <ul className="partner-logos">
      {partners.map((partner) => (
        <li key={partner.logo} className="partner-logos__item">
          <img src={partner.logo} alt={partner.name} className="partner-logos__img" loading="lazy" />
        </li>
      ))}
    </ul>
  );
}
