import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "#FDF6E3",
          "--normal-text": "#2C1A0E",
          "--normal-border": "#4A2E1B",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
