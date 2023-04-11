import io from "socket.io-client";
import { useCallback, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Rnd } from "react-rnd";
const pc_config = {
  //iceServers: [
  //  {
  //    urls: [
  //      "stun:stun.l.google.com:19302",
  //      "stun:stun1.l.google.com:19302",
  //      "stun:stun2.l.google.com:19302",
  //      "stun:stun3.l.google.com:19302",
  //      "stun:stun4.l.google.com:19302",
  //    ],
  //  },
  //],
};
//const roomName = "1234";
const SOCKET_SERVER_URL = "http://localhost:5000";
//const SOCKET_SERVER_URL = "https://webcam-backend-13oo.onrender.com";


const RoomHeader = ({
  myMemo,
  onChangeMyMemo
}) => {
  return(
    <header>
      
    </header>
  )
}

const RoomVideosSection = ({
  users,
  isMuted,
  isCameraOn,
  localVideoRef,
  MuteBtn,
  VideoBtn
}) => {
  return(
    <section>
      <div>
        <Rnd
          className="border"
          default={{
            x: 1600,
            y: 30,
            width: 320,
            height: "auto"
          }}
          style={{ 
            zIndex: 2,
          }}
        >
          <video
            muted={true}
            ref={localVideoRef}
            autoPlay
            style={{ 
              width: "100%", 
              height: "100%",
              borderRadius: "10%"
            }}
          >
            <button onClick={MuteBtn}>{isMuted ? (
              <i className="fa-solid fa-microphone"></i>
            ) : (<i className="fa-solid fa-microphone-slash"></i>)}</button>
            <button onClick={VideoBtn}>{isCameraOn ? (<i className="fa-solid fa-camera-slash"></i>)
            : (<i className="fa-solid fa-camera"></i>)}</button>
          </video>
        </Rnd>
      </div>
      <div>
          {users.map((user, index) => (
            <Video 
              key={index}
              stream={user.stream}
              xPosition={1600}
              yPosition={(index + 1) * 300 + 30}
            />
          ))}
      </div>
    </section>
  )
}

const RoomFooter = () => {
  return(
    <footer>
        <div
          className="fixed-bottom bg-primary mb-3 d-flex justify-content-center bg-opacity-50"
          style={{ zIndex: 3 }}
        >
        <div className="text-light text-center p-3">
          <i className="fa-duotone fa-microphone"></i>
        </div>
      </div>
    </footer>
  )
}

const Video = ({ stream, muted, xPosition, yPosition }) => {
  const ref = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    if (ref.current) ref.current.srcObject = stream;
    if (muted) setIsMuted(muted);
    setIsLoading(false);
  }, [stream, muted, xPosition, yPosition]);

  if (isLoading) {
    return <></>;
  }

  const MuteBtn = () => {
    console.log(isMuted);
    setIsMuted(!isMuted);
  };

  return (
    <>
      <Rnd
        default={{
          x: xPosition,
          y: yPosition,
          width: 320,
          height: "auto",
        }}
        style={{ zIndex: 2 }}
      >
        <video
          muted={isMuted}
          ref={ref}
          autoPlay
          style={{ width: "100%", height: "100%" }}
        />
        {isMuted ? (
          <>
            <button onClick={MuteBtn}>마이크 온~</button>
          </>
        ) : (
          <>
            <button onClick={MuteBtn}>음소거~</button>
          </>
        )}
      </Rnd>
    </>
  );
};

const Room = () => {
  const location = useLocation();
  const roomName = location.pathname.split('/')[2];
  const socketRef = useRef();
  const pcsRef = useRef({});
  const localVideoRef = useRef(null);
  const localStreamRef = useRef();
  const [users, setUsers] = useState([]);
  const [isCameraOn, setIsCameraOn] = useState(true); // eslint-disable-line no-unused-vars
  const [isMuted, setIsMuted] = useState(false);

  // Menu
  const [ isMenuOn, setIsMenuOn ] = useState(false);
  const [ myMemo, setMyMemo ] = useState("");

  const onChangeMyMemo = (e) => {
    setMyMemo(e.target.value);
  }

  const GetLocalStream = useCallback(async () => {
    try {
      // 로컬 스트림 정보 받아오기
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = localStream;
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      if (!socketRef.current) return;
      socketRef.current.emit("join_room", {
        room: roomName,
      });
    } catch (e) {
      console.log(`getUserMedia error: ${e}`);
    }
  }, []);

  const MuteBtn = () => {
    setIsMuted(!isMuted);
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
    GetLocalStream();
  };
  const VideoBtn = () => {
    setIsCameraOn(!isCameraOn);
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = isCameraOn;
    });
    GetLocalStream();
  };
  const CreatePeerConnection = useCallback((socketID) => {
    console.log(socketID);
    try {
      // Create Peer Connection (관계)
      const pc = new RTCPeerConnection(pc_config);

      // event 생성 중
      // myPeerConnection.addEventListener("icecandidate", handleIce);
      // 자신의 Ice Candidate를 생성하기 시작합니다.
      pc.onicecandidate = (e) => {
        if (!(socketRef.current && e.candidate)) {
          return;
        } else {
          console.log("On ICECandidate");
          socketRef.current.emit("candidate", {
            // sender의 RTCIceCandidate
            candidate: e.candidate,
            // Candidate를 보내는(Sender) user의 socket id
            candidateSendID: socketRef.current.id,
            // candidate를 받는 user의 socket id
            candidateReceiveID: socketID,
          });
        }
      };

      // event 생성 중
      pc.oniceconnectionstatechange = (e) => {
        console.log(e);
      };

      // event 생성 중
      // On Track 작업 성공 여부 기다림
      pc.ontrack = (e) => {
        console.log("on track success");
        setUsers((oldUsers) =>
          oldUsers
            .filter((user) => user.id !== socketID)
            .concat({
              id: socketID,
              stream: e.streams[0],
            })
        );
      };

      // pc에 local stream ref 정보 추가
      if (localStreamRef.current) {
        console.log("localstream add");
        localStreamRef.current.getTracks().forEach((track) => {
          if (!localStreamRef.current) {
            return;
          } else {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      } else {
        console.log("no local stream");
      }

      return pc;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }, []);

  useEffect(() => {
    socketRef.current = io.connect(SOCKET_SERVER_URL);
    GetLocalStream();

    //'similar to welcome'
    socketRef.current.on("all_users", (allUsers) => {
      // 모든 user들에 대해 다음과 같은 작업을 수행
      allUsers.forEach(async (user) => {
        if (!localStreamRef.current) return;
        // 2~ 새 Peer Connection 생성하기
        const pc = CreatePeerConnection(user.id);
        if (!(pc && socketRef.current)) return;
        // 새로운 Peer Connection을 pcs(pc 모음)에 관리
        pcsRef.current = { ...pcsRef.current, [user.id]: pc };
        try {
          // Create Channel
          //dataChannel.current = pc.createDataChannel("chat");
          //dataChannel.current.addEventListener("message", (event) => {
          //  setLines((prevLines) => [...prevLines, JSON.parse(event.data)]);
          //});
          //console.log("made data channel");

          // offer를 만드는 중
          const localSdp = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          console.log("Create Offer Success");
          await pc.setLocalDescription(new RTCSessionDescription(localSdp));
          // Offer 보내기
          socketRef.current.emit("offer", {
            sdp: localSdp,
            offerSendID: socketRef.current.id,
            offerReceiveID: user.id,
          });
        } catch (e) {
          console.error(e);
        }
      });
    });

    // Offer를 받은 경우 (2번 끝)
    socketRef.current.on("getOffer", async (data) => {
      const { sdp, offerSendID } = data;
      console.log("Get Offer");
      if (!localStreamRef.current) return;
      // 관계 만들기 시도 (3번 실행을 위한 준비)
      const pc = CreatePeerConnection(offerSendID);
      if (!(pc && socketRef.current)) return;
      // 새 관계(pc) 저장하기
      pcsRef.current = { ...pcsRef.current, [offerSendID]: pc };
      try {
        // Data Channel 만들기
        //pc.addEventListener("datachannel", (event) => {
        //  dataChannel.current = event.channel;
        //  dataChannel.current.addEventListener("message", (event) => {
        //    setLines((prevLines) => [...prevLines, JSON.parse(event.data)]);
        //  });
        //});
        //console.log("peer b data channel creates");

        // 매개변수 꼭 확인하기!
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log("Answer Set Remote Description Success");
        const localSdp = await pc.createAnswer({
          offerToReceiveVideo: true,
          offerToReceiveAudio: true,
        });
        await pc.setLocalDescription(new RTCSessionDescription(localSdp));
        console.log("answer 만들기");
        // Answer 보내기
        socketRef.current.emit("answer", {
          sdp: localSdp,
          answerSendID: socketRef.current.id,
          answerReceiveID: offerSendID,
        });
      } catch (e) {
        console.error(e);
      }
    });

    // Answer 받기
    socketRef.current.on("getAnswer", (data) => {
      const { sdp, answerSendID } = data;
      console.log("Get Answer");
      const pc = pcsRef.current[answerSendID];

      if (!pc) return;
      // 매개 변수 꼭 확인하기!
      pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    // ICE Candidate 생성 및 서로 주고 받기
    socketRef.current.on("getCandidate", async (data) => {
      const pc = pcsRef.current[data.candidateSendID];
      if (!pc) return;
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      console.log("Candidate Add Success");
    });

    // user exit
    socketRef.current.on("user_exit", (data) => {
      if (!pcsRef.current[data.id]) return;
      pcsRef.current[data.id].close();
      delete pcsRef.current[data.id];
      setUsers((oldUsers) => oldUsers.filter((user) => user.id !== data.id));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      users.forEach((user) => {
        if (!pcsRef.current[user.id]) return;
        pcsRef.current[user.id].close();
        delete pcsRef.current[user.id];
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container">

      <RoomHeader 
        
      />
      <RoomVideosSection 
        users={users}
        isMuted={isMuted}
        isCameraOn={isCameraOn}
        localVideoRef={localVideoRef}
        MuteBtn={MuteBtn}
        VideoBtn={VideoBtn}
      />


      <RoomFooter />


    </div>
  );
};

export default Room;
