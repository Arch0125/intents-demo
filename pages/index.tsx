import {Box,Button,HStack,Heading,Icon,Input,Stack,Text,VStack,useToast} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { NextPage } from "next";
import { useState, useEffect } from "react";
import { BsFillMicFill } from "react-icons/bs";
import dynamic from "next/dynamic";
import { useContext } from "react";
import { SmartAccountContext } from "../contexts/SCWContext";
import {
  IHybridPaymaster,
  SponsorUserOperationDto,
  PaymasterMode,
} from "@biconomy/paymaster";
// import { useReactMediaRecorder } from 'react-media-recorder'

declare global {
  interface Window {
    ethereum: any;
  }
}

// const SocialLogin = dynamic(() => import('../components/SocialLogin'), { ssr: false })
const BiconomySocialLogin = dynamic(
  () => import("../components/v2SocialLogin"),
  {
    ssr: false,
  }
);

const Home: NextPage = () => {

  const toast = useToast();

  const { smartAccount } = useContext(SmartAccountContext);
  console.log("Smart Account : ", smartAccount);

  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(
    null
  );
  const [login, setLogin] = useState<(() => Promise<void>) | null>(null);
  const [logout, setLogout] = useState<(() => Promise<void>) | null>(null);
  const [account, setAccount] = useState("");
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [chainId, setChainId] = useState("");
  const [txnHash, setTxnHash] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    if (login) login();
  }, [login]);

  // functions
  const getIntent = async () => {

    if (!command.toLowerCase().includes("send")) {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ body: `${command}` }),
      };
      const response = await fetch('http://localhost:8000/completion', options);
      toast({
        title: "Transaction Submitted",
        description: `Borrowing 0.0001 USDT from AAVE Pool. \n
                      0.0001 USDT will be transferred from Pool address 0x0b913A76beFF3887d35073b8e5530755D60F78C7 
                      to your account ${account}`,
        status: "info",
        duration: 10000,
        isClosable: true,
      });
      const data = await response.json();
      console.log("Transaction hash is :",data);
      setLoading(false);
      setTxHash(data);
    }
    else{
      let url = `https://intents-api.onrender.com/intents`;
      setLoading(true);
      console.log(`Execuing command: ${command}`);
  
      const chainIdfromMetamask = await window.ethereum.request({
        method: "eth_chainId",
      });
      const chainidfromhex = parseInt(chainIdfromMetamask, 16);
      const chain = chainidfromhex.toString();
      setChainId(chain);
      console.log("Chain Id : ", chainId);
  
      const res = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          recipient: smartAccountAddress,
          command: command,
          chainId: chainidfromhex,
        }),
      });
      const data = await res.json();
      const { info } = data;
      console.log(data);
      sendTransactionWithPaymaster(
        info.txObject.to,
        info.txObject.value,
        info.txObject.data
      );
    }
  };

  const sendTransactionWithPaymaster = async (
    to: string,
    value: string,
    data: string
  ) => {
    try {
      const tx1 = {
        to: to,
        value: value,
        data: data,
      };
      let partialUserOp = await smartAccount.buildUserOp([tx1]);
      const biconomyPaymaster =
        smartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
      let paymasterServiceData: SponsorUserOperationDto = {
        mode: PaymasterMode.SPONSORED,
        // optional params...
      };
      const paymasterAndDataResponse =
        await biconomyPaymaster.getPaymasterAndData(
          partialUserOp,
          paymasterServiceData
        );
      partialUserOp.paymasterAndData =
        paymasterAndDataResponse.paymasterAndData;
      const userOpResponse = await smartAccount.sendUserOp(partialUserOp);
      const transactionDetails = await userOpResponse.wait();

      console.log("Transaction Details:", transactionDetails);
      console.log("Transaction Hash:", userOpResponse.userOpHash);

      setTxnHash(userOpResponse.userOpHash);
      setLoading(false);
    } catch (err) {
      console.error("Error sending transaction: ", err);
    }
  };

  const connectToMetamask = async () => {
    // @ts-ignore
    if (typeof window.ethereum !== "undefined") {
      // @ts-ignore
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];
      setAccount(account);
      // @ts-ignore
      const hexchainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      const chainId = parseInt(hexchainId, 16).toString();
      setChainId(chainId);
      console.log(account, chainId);
    }
  };


  return (
    <Box bg={"white"} h={"100vh"} fontFamily={"Space Mono"}>
      <HStack
        px={[4, 8, 12]}
        py={[4, 8, 12]}
        align={"center"}
        justify={"end"}
      >
        <HStack spacing={8}>
          <BiconomySocialLogin
            setLogin={setLogin}
            setLogout={setLogout}
            setSmartAccountAddress={setSmartAccountAddress}
          />
          {!smartAccountAddress ? (
            <Button
              bgColor={"whiteAlpha.700"}
              color={"purple.500"}
              _hover={{ bgColor: "whiteAlpha.900" }}
            >
              Login
            </Button>
          ) : (
            <VStack>
              <Text color={"purple.800"}>SCW Address:</Text>
              <Text color={"purple.500"}>{smartAccountAddress.slice(0,6)}...{smartAccountAddress.slice(-6)}</Text>
            </VStack>
          )}
          {!account ? (
            <Button
              onClick={connectToMetamask}
              bgColor={"whiteAlpha.700"}
              color={"purple.500"}
              _hover={{ bgColor: "whiteAlpha.900" }}
            >
              Connect Wallet
            </Button>
          ) : (
            <VStack>
              <Text color={"purple.800"}>EOA Address:</Text>
              <Text color={"purple.500"}>
                {account.slice(0, 6)}...{account.slice(-4)}
              </Text>
            </VStack>
          )}
        </HStack>
      </HStack>
      <VStack px={[4, 8, 12]} py={[4, 8, 12]}>
        {/* hero stuff goes here */}
        <Text color={"purple.700"} fontWeight={"bold"} mb={2} fontSize={"4xl"}>
        From Words to Web3: 
        </Text>
        <Text color={"purple.400"} fontWeight={"semibold"} mb={8} fontSize={"3xl"}>
        Powering Seamless Blockchain Interactions.
        </Text>
        <Input
          textAlign={"center"}
          mt={4}
          maxW={"container.sm"}
          height={"5vh"}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Type your intent..."
          color={"purple.600"}
          variant={"filled"}
          bgColor={"whiteAlpha.700"}
          _focus={{ bgColor: "whiteAlpha.900", borderColor: "purple.600" }}
          _hover={{ bgColor: "whiteAlpha.900" }}
          _placeholder={{ color: "purple.700" }}
          border={"2px"}
          borderColor={"purple.900"}
        />
        <HStack>
          <Button
            onClick={getIntent}
            bgColor={"purple.900"}
            color={"white"}
            _hover={{ bgColor: "purple.500" }}
            isLoading={loading}
            disabled={loading}
            mt={6}
          >
            Send Intent
          </Button>
        </HStack>
        {!txnHash ? (
          !txHash ? null 
          :
          <Box
            maxW={"container.sm"}
            mt={8}
            color={"purple.400"}
            fontSize={"md"}
            onClick={() =>
              window.open(
                `https://mumbai.polygonscan.com/tx/${txHash}`,
                "_blank"
              )
            }
          >
            Verify your transaction here
          </Box>
        ) : (
          <Box
            maxW={"container.sm"}
            mt={8}
            color={"purple.200"}
            fontSize={"md"}
            onClick={() =>
              window.open(
                `https://www.jiffyscan.xyz/userOpHash/${txnHash}?network=mumbai`,
                "_blank"
              )
            }
          >
            Verify your transaction here
          </Box>
        )}
        {/* footer stuff goes here */}
        <HStack px={[4, 8, 12]} py={[4, 8, 12]}>
          <Text color={"purple.600"}>&copy; Powered by Polygon</Text>
        </HStack>
      </VStack>
    </Box>
  );
};

export default Home;
