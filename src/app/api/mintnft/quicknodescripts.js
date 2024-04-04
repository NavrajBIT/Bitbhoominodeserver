const {
  Connection,
  Keypair,
  SystemInstruction,
  Transaction,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
const {
  LAMPORTS_PER_SOL,
  Token,
  AccountInfo,
  PublicKey,
  TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
import bs58 from "bs58";

const metadata = {
  name: "My Awesome NFT",
  image: "https://arweave.net/your_image_cid.png",
  description: "This is a very cool NFT",
};

async function mintNFT() {
  const connection = new Connection(
    "https://solana-devnet.g.alchemy.com/v2/SSqT4TgPt0cWnqyRdJl8AgbyR0HVoi-N",
    "confirmed"
  );

  console.log("1------------------");
  const payerPrivateKey = process.env.NEXT_PRIVATE_KEY;
  const payerPrivateKeydecoded = bs58.decode(payerPrivateKey);
  const mintKeypair = Keypair.fromSecretKey(payerPrivateKeydecoded);
  const walletPrivateKey = payerPrivateKeydecoded;

  const mintAccount = await connection.getAccountInfo(mintKeypair.publicKey);
  //   if (mintAccount) {
  //     throw new Error("Mint account already exists");
  //   }
  console.log("2------------------");

  //   const lamports = await connection.getMinimumBalanceForRentExemptAccount(
  //     Token.getMinNumLamports(10)
  //   );

  const minlamports = 10000;

  console.log("3------------------");

  const transaction = new Transaction();
  transaction.add(
    SystemInstruction.createAccount({
      fromPublicKey: payerPrivateKeydecoded,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: minlamports,
      space: minlamports,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  console.log("4------------------");
  transaction.add(
    Token.createInitMintInstruction(
      mintKeypair.publicKey,
      1, // Specify the number of decimals for the token
      payerPrivateKeydecoded
    )
  );

  console.log("5------------------");
  const associatedTokenAccount = await Token.getAssociatedTokenAddress(
    mintKeypair.publicKey,
    payerPrivateKeydecoded
  );
  transaction.add(
    Token.createAssociatedTokenAccountInstruction(
      walletPrivateKey,
      associatedTokenAccount,
      payerPrivateKeydecoded,
      mintKeypair.publicKey
    )
  );

  console.log("6------------------");
  transaction.add(
    Token.createMintToInstruction(
      mintKeypair.publicKey,
      associatedTokenAccount,
      payerPrivateKeydecoded,
      1 // Specify the amount to mint
    )
  );

  // Upload the metadata to a permanent storage solution (e.g., Arweave)
  // This example assumes you already have uploaded the metadata and have the URI
  const metadataUri = "your_metadata_uri"; // Replace with your actual URI

  // Get the size of the metadata in bytes
  const metadataBuffer = Buffer.from(JSON.stringify(metadata));
  const metadataSize = metadataBuffer.length;

  console.log("7------------------");
  const metadataAccountKeypair = Keypair.generate();
  transaction.add(
    SystemInstruction.createAccount({
      fromPublicKey: walletPrivateKey,
      newAccountPubkey: metadataAccountKeypair.publicKey,
      lamports: lamports + metadataSize,
      space: metadataSize,
      programId: SystemProgram.programId,
    })
  );

  console.log("8------------------");
  transaction.add(
    new TransactionInstruction({
      keys: [
        {
          pubkey: metadataAccountKeypair.publicKey,
          isSigner: false,
          isWritable: true,
        },
      ],
      programId: SystemProgram.programId,
      data: metadataBuffer,
    })
  );

  console.log("9------------------");
  transaction.add(
    Token.createSetAuthorityInstruction(
      associatedTokenAccount,
      Token.AuthorityType.Metadata,
      metadataAccountKeypair.publicKey,
      walletPrivateKey
    )
  );

  console.log("10------------------");
  transaction.sign(walletPrivateKey);

  console.log("11------------------");
  const txSignature = await sendAndConfirmTransaction(connection, transaction);
  console.log("Transaction signature:", txSignature);

  console.log("Minted NFT with metadata!");
  console.log("NFT Mint Address:", mintKeypair.publicKey.toString());
}

export default mintNFT;
