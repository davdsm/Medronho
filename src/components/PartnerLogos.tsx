import { partners } from "../data";

export function PartnerLogos() {
  return (
    <ul className="partner-logos">
      {partners.map((partner) => {
        const large = partner.logo.includes("serq");
        const tall = partner.logo.includes("tagus-valley");
        const sizeClass = large ? " partner-logos__item--lg" : tall ? " partner-logos__item--tall" : "";
        return (
          <li key={partner.logo} className={`partner-logos__item${sizeClass}`}>
            <img
              src={partner.logo}
              alt={partner.name}
              className="partner-logos__img"
              loading="lazy"
            />
          </li>
        );
      })}
    </ul>
  );
}
