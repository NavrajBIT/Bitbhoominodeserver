import {
  Metaplex,
  keypairIdentity,
  irysStorage,
} from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";

const secret =
  "Input the Secret Key";

const NODE_RPC = clusterApiUrl("mainnet-beta");
const SOLANA_CONNECTION = new Connection(NODE_RPC);

const WALLET = Keypair.fromSecretKey(bs58.decode(secret));
console.log(WALLET);

const METAPLEX = Metaplex.make(SOLANA_CONNECTION)
  .use(keypairIdentity(WALLET))
  .use(
    irysStorage()
  );

const CONFIG = {
  uploadPath: "uploads/",
  imgFileName: "image.png",
  imgType: "image/png",
  imgName: "QuickNode Pixel",
  description: "Pixel infrastructure for everyone!",
  attributes: [
    { trait_type: "Speed", value: "Quick" },
    { trait_type: "Type", value: "Pixelated" },
    { trait_type: "Background", value: "QuickNode Blue" },
  ],
  sellerFeeBasisPoints: 500, //500 bp = 5%
  symbol: "QNPIX",
  creators: [{ address: WALLET.publicKey, share: 100 }],
};

export async function uploadMetadata(
  imgUri,
  imgType,
  nftName,
  description,
  attributes
) {
  console.log("uploading metadata");
  try {
    const { uri } = await METAPLEX.nfts().uploadMetadata({
      name: nftName,
      description: description,
      image: imgUri,
      attributes: attributes,
      properties: {
        files: [
          {
            type: imgType,
            uri: imgUri,
          },
        ],
      },
    });
    console.log("   Metadata URI:", uri);
    return uri;
  } catch (error) {
    console.error("Error Upploading Metadata:", error);
    throw error;
  }
}

export async function mintNft(metadataUri, name, sellerFeeBasisPoints, symbol) {
  try {
    const { nft } = await METAPLEX.nfts().create(
      {
        uri: metadataUri,
        name: name,
        sellerFeeBasisPoints: sellerFeeBasisPoints,
        symbol: symbol,
      },
      { commitment: "finalized" }
    );
    // console.log("nft", nft);
    // const nftAddress = nft.address;
    // console.log(nftAddress);
    let { signature, confirmResponse } = await METAPLEX.rpc().sendAndConfirmTransaction(transactionBuilder);

    console.log(
      `Minted NFT: https://explorer.solana.com/address/${nftAddress}?cluster=mainnet-beta`
    );
    return nft;
    // try {
    //     const nft = await METAPLEX.nfts().create({
    //       uri: metadataUri,
    //       name: name,
    //       sellerFeeBasisPoints: sellerFeeBasisPoints,
    //       symbol: symbol,
    //     });
    //     // console.log("nft", nft);
    //     // const nftAddress = nft.address;
    //     // console.log(nftAddress);
    //     let signature = await METAPLEX.nfts().sendTransaction(nft);
    //     const latestBlockHash = await METAPLEX.rpc().getLatestBlockhash();
    //     const confirmResponse= METAPLEX.nfts().confirmTransaction({
    //       blockhash: latestBlockHash.blockhash,
    //       lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    //       signature: signature,
    //     });
    //     console.log("signature", signature);
    //     console.log("confirmResponse", confirmResponse);
    
    //     console.log(
    //       `Minted NFT: https://explorer.solana.com/address/${nftAddress}?cluster=mainnet-beta`
    //     );
    //     return nft;
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw error;
  }
}

export async function transferNft(nftAddress, recipientAddress) {
  console.log("check address", nftAddress);
  try {
    // const nft = await METAPLEX.nfts().findByToken({ tokenAddress: nftAddress });
    // console.log("nft",nft);
    const tx = await METAPLEX.nfts()
      .builders()
      .transfer({
        nftOrSft: {
          address: nftAddress,
          tokenStandard: TokenStandard.NonFungible,
        },
        fromOwner: WALLET.publicKey,
        toOwner: recipientAddress,
      });
    let { signature: sig, confirmResponse: res } =
      await METAPLEX.rpc().sendAndConfirmTransaction(tx, {
        commitment: "finalized",
      });
    if (res.value.err) {
      throw new Error("failed to confirm transfer transaction");
    }
    console.log(`   Tx: https://explorer.solana.com/tx/${sig}?cluster=mainnet-beta`);
    console.log(
      `Transferred NFT ${nftAddress} to recipient ${recipientAddress}`
    );
    console.log("tx", tx);
  } catch (error) {
    console.error("Error transferring NFT:", error);
    throw error;
  }
}

// Call the functions sequentially
export async function main() {
  try {
    const imgUri =
      "https://d2fggdczigjbd1.cloudfront.net/ipfs/QmQRv6iENv9FeTz8gLD6eZsGPUDbJ6dH8zmLMf6gmmTT5j";
    const metadataUri = await uploadMetadata(
      imgUri,
      CONFIG.imgType,
      CONFIG.imgName,
      CONFIG.description,
      CONFIG.attributes
    );
    const nft = await mintNft(metadataUri, "MyNFT", 500, "NFT");
    console.log("nft:", nft);
    const nftAddress = nft.address;
    console.log("NFT minted successfully:", nftAddress);
    const authority = nft.mint.mintAuthorityAddress;
    console.log("authority", authority);
    const recipientAddress = new PublicKey(
      "4RW1m9yj5W52nxMMF1F4rhztFdqVxo3MYa2jMioAFgJT"
    );
    await transferNft(nftAddress, recipientAddress);
    console.log("NFT transferred successfully");
  } catch (error) {
    console.error("Error:", error);
  }
}
