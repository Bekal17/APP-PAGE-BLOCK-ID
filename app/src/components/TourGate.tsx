import { useEffect, useState, type ReactNode } from "react";
import { useBlockIDWallet } from "@/hooks/useBlockIDWallet";
import { getSessionToken, getSocialProfile } from "@/services/blockidApi";
import AppTour from "@/components/AppTour";

export default function TourGate({ children }: { children: ReactNode }) {
  const { address: wallet } = useBlockIDWallet();
  const [tourDone, setTourDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (!wallet) {
      setTourDone(true); // not logged in, skip tour
      return;
    }
    getSocialProfile(wallet)
      .then((profile: any) => {
        setTourDone(profile?.has_completed_tour === true);
      })
      .catch(() => setTourDone(true)); // on error, skip tour
  }, [wallet]);

  // Loading — render nothing until we know
  if (tourDone === null) return null;

  // Tour not done — show AppTour overlay
  if (!tourDone) {
    const sessionToken = getSessionToken() ?? "";
    return (
      <>
        {children}
        <AppTour
          wallet={wallet ?? ""}
          sessionToken={sessionToken}
          onComplete={() => setTourDone(true)}
        />
      </>
    );
  }

  // Tour done — render app normally
  return <>{children}</>;
}
