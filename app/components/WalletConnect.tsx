import { useWallet } from "@solana/wallet-adapter-react";
import { useSubmit } from "@remix-run/react";

export function WalletConnect() {
  const { publicKey, signMessage } = useWallet();
  const submit = useSubmit();

  const handleAuth = async (actionType: "connect" | "create") => {
    if (!publicKey || !signMessage) return;
    
    const message = new TextEncoder().encode(
      actionType === "create" 
        ? "Create account on MyApp" 
        : "Sign in to MyApp"
    );
    
    const signature = await signMessage(message);
    
    const formData = new FormData();
    formData.append("publicKey", publicKey.toString());
    formData.append("signature", JSON.stringify(signature));
    formData.append("action", actionType);

    submit(formData, { method: "post", action: "/auth/solana" });
  };

  return (
    <div>
      <button onClick={() => handleAuth("connect")}>Connect Wallet</button>
      <button onClick={() => handleAuth("create")}>Create New Wallet</button>
    </div>
  );
}