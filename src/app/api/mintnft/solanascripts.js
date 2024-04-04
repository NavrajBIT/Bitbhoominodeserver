import {
  getAccount,
  createMint,
  createAccount,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  transfer,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

import base58 from "bs58";
const connection = new Connection(
  "https://solana-devnet.g.alchemy.com/v2/SSqT4TgPt0cWnqyRdJl8AgbyR0HVoi-N",
  "confirmed"
);

export const mintnft = async (recipientAddress) => {
  console.log("1------------------");
  const payerPrivateKey = process.env.NEXT_PRIVATE_KEY;
  const payerPrivateKeydecoded = base58.decode(payerPrivateKey);
  const wallet = Keypair.fromSecretKey(payerPrivateKeydecoded);
  console.log("2------------------");

  const mint = await createMint(
    connection,
    wallet,
    wallet.publicKey,
    wallet.publicKey,
    0
  );
  console.log("3------------------");

  const recipient = new PublicKey(recipientAddress);
  console.log("4------------------");

  const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    wallet.publicKey
  );

  console.log("5------------------");
  await mintTo(
    connection,
    wallet,
    mint,
    associatedTokenAccount.address,
    wallet,
    1
  );
  console.log("6------------------");
};
