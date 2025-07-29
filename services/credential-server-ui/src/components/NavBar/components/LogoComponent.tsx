import React from "react";
import DefaultLogo from "../../../assets/Logo.svg";

interface LogoComponentProps {
  logoUrl?: string;
  organizationName: string;
  className?: string;
  alt?: string;
}

export const LogoComponent: React.FC<LogoComponentProps> = ({
  logoUrl,
  organizationName,
  className = "header-logo",
  alt,
}) => {
  const logoSrc = logoUrl || DefaultLogo;
  const altText = alt || `${organizationName} logo`;

  return (
    <img
      className={className}
      alt={altText}
      src={logoSrc}
      onError={(e) => {
        // Fallback to default logo if custom logo fails to load
        const target = e.target as HTMLImageElement;
        if (target.src !== DefaultLogo) {
          console.warn(
            `Failed to load custom logo: ${logoSrc}, falling back to default`
          );
          target.src = DefaultLogo;
          target.alt = `${organizationName} logo (default)`;
        }
      }}
    />
  );
};
