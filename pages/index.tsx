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
  const header = `intents`;

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
  // const { previewAudioStream, status, startRecording, stopRecording } = useReactMediaRecorder({ audio: true })

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
      const data = await response.json();
      console.log("Transaction hash is :",data);
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
      // @ts-ignore
      // await window.ethereum.request({
      // 	method: 'eth_sendTransaction',
      // 	params: [{
      // 		from: account,
      // 		to: info.txObject.to,
      // 		value: info.txObject.value,
      // 		data: info.txObject.data,
      // 	}]
      // })
  
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

  // queries
  // const getIntentQuery = useQuery({
  // 	queryKey: ['intents'],
  // 	queryFn: getIntent
  // })

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

  // let docsUrl = `https://brindle-dolomite-6fa.notion.site/API-Documentation-d61b477a2478475eba804f71807d0818?pvs=4`;

  return (
    <Box bg={"blackAlpha.900"} h={"100vh"} fontFamily={"Dm Mono"}>
      <HStack
        px={[4, 8, 12]}
        py={[4, 8, 12]}
        align={"center"}
        justify={"space-between"}
      >
        <Stack spacing={0}>
          <Heading
            fontWeight={"medium"}
            color={"blue.500"}
            fontFamily={"Ubuntu Mono"}
          >
            {header}
          </Heading>
          {/* <Text color={"green.100"} fontSize={"xs"}>{`by bytekode labs`}</Text> */}
        </Stack>
        <HStack spacing={8}>
          <BiconomySocialLogin
            setLogin={setLogin}
            setLogout={setLogout}
            setSmartAccountAddress={setSmartAccountAddress}
          />
          {!smartAccountAddress ? (
            <Button
              bgColor={"blackAlpha.700"}
              color={"blue.500"}
              _hover={{ bgColor: "blackAlpha.900" }}
            >
              Login
            </Button>
          ) : (
            <VStack>
              <Text>SCW Address:</Text>
              <Text color={"blue.500"}>{smartAccountAddress.slice(0,6)}...{smartAccountAddress.slice(-6)}</Text>
            </VStack>
          )}
          {/* <Text
            as={"a"}
            href={docsUrl}
            referrerPolicy="no-referrer"
            target="_blank"
            color={"green.500"}
          >
            Docs
          </Text> */}
          {!account ? (
            <Button
              onClick={connectToMetamask}
              bgColor={"blackAlpha.700"}
              color={"blue.500"}
              _hover={{ bgColor: "blackAlpha.900" }}
            >
              Connect Wallet
            </Button>
          ) : (
            <VStack>
              <Text>EOA Address:</Text>
              <Text color={"blue.500"}>
                {account.slice(0, 6)}...{account.slice(-4)}
              </Text>
            </VStack>
          )}
        </HStack>
      </HStack>
      <VStack px={[4, 8, 12]} py={[4, 8, 12]}>
        {/* hero stuff goes here */}
        <Text color={"blue.200"} mb={2} fontSize={"3xl"}>
        From Words to Web3: 
        </Text>
        <Text color={"blue.200"} mb={8} fontSize={"2xl"}>
        Powering Seamless Blockchain Interactions.
        </Text>
        <Input
          textAlign={"center"}
          maxW={"container.sm"}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Type your intent..."
          color={"blue.500"}
          variant={"filled"}
          bgColor={"blackAlpha.700"}
          _focus={{ bgColor: "blackAlpha.900", borderColor: "blue.500" }}
          _hover={{ bgColor: "blackAlpha.900" }}
          _placeholder={{ color: "blue.500" }}
          border={"2px"}
          borderColor={"blue.800"}
        />
        <HStack>
          <Button
            onClick={getIntent}
            bgColor={"blackAlpha.900"}
            color={"blue.500"}
            _hover={{ bgColor: "blackAlpha.700" }}
            isLoading={loading}
            disabled={loading}
          >
            Execute
          </Button>
          {/* <Button bgColor={'blackAlpha.900'} color={'green.500'} _hover={{ bgColor: 'blackAlpha.700' }}>
						<Icon as={BsFillMicFill}/>
					</Button> */}
        </HStack>
        {!txnHash ? (
          !txHash ? null 
          :
          <Box
            maxW={"container.sm"}
            mt={8}
            color={"blue.200"}
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
            color={"blue.200"}
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
        {/* <HStack px={[4, 8, 12]} py={[4, 8, 12]}>
          <Text color={"green.600"}>&copy; 2023 {`Bytekode Labs, Inc`}</Text>
        </HStack> */}
      </VStack>
    </Box>
  );
};

export default Home;
