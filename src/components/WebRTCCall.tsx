import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import Icon from './ui/icon';

type WebRTCCallProps = {
  chatId: number;
  userId: number;
  receiverId: number;
  callType: 'audio' | 'video';
  onEnd: () => void;
};

export const WebRTCCall = ({ chatId, userId, receiverId, callType, onEnd }: WebRTCCallProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    setupCall();
    return () => {
      cleanup();
    };
  }, []);

  const setupCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });
      
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      };
      
      peerConnection.current = new RTCPeerConnection(configuration);
      
      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsConnected(true);
        }
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE candidate:', event.candidate);
        }
      };

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

    } catch (error) {
      console.error('Failed to setup call:', error);
    }
  };

  const cleanup = () => {
    localStream.current?.getTracks().forEach(track => track.stop());
    peerConnection.current?.close();
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
        
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
      } else {
        const videoTrack = localStream.current?.getVideoTracks()[0];
        const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
        
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    }
  };

  const handleEnd = () => {
    cleanup();
    onEnd();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {callType === 'video' && (
          <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-border">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <Icon name="Phone" size={40} />
              </div>
              <p className="text-xl">Соединение...</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border bg-card">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={toggleMute}
          >
            <Icon name={isMuted ? 'MicOff' : 'Mic'} size={24} />
          </Button>

          {callType === 'video' && (
            <>
              <Button
                variant={isVideoEnabled ? 'secondary' : 'destructive'}
                size="icon"
                className="w-14 h-14 rounded-full"
                onClick={toggleVideo}
              >
                <Icon name={isVideoEnabled ? 'Video' : 'VideoOff'} size={24} />
              </Button>

              <Button
                variant={isScreenSharing ? 'default' : 'secondary'}
                size="icon"
                className="w-14 h-14 rounded-full"
                onClick={toggleScreenShare}
              >
                <Icon name="MonitorUp" size={24} />
              </Button>
            </>
          )}

          <Button
            variant="destructive"
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={handleEnd}
          >
            <Icon name="PhoneOff" size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
};
