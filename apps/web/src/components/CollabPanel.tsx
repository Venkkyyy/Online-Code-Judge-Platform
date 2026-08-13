import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'; 

export default function CollabPanel({ roomId }: { roomId: string }) {
  const [inCall, setInCall] = useState(false);
  const [sharingScreen, setSharingScreen] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      streamRef.current = stream;
      
      const socketUrl = API_URL.replace('/api/v1', '');
      socketRef.current = io(socketUrl, { withCredentials: true });
      const socket = socketRef.current;
      
      socket.emit('join-room', roomId);
      setInCall(true);

      socket.on('user-connected', (userId) => {
        const peer = createPeer(socket, true);
        peerRef.current = peer;
      });

      socket.on('offer', async (payload) => {
        const peer = createPeer(socket, false);
        peerRef.current = peer;
        await peer.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('answer', { roomId, answer });
      });

      socket.on('answer', async (payload) => {
        const peer = peerRef.current;
        if (peer) {
          await peer.setRemoteDescription(new RTCSessionDescription(payload.answer));
        }
      });

      socket.on('ice-candidate', (payload) => {
        const peer = peerRef.current;
        if (peer) {
          peer.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(console.error);
        }
      });

    } catch (err) {
      console.error('Failed to get media', err);
      alert('Camera/Mic permission denied');
    }
  };

  const createPeer = (socket: Socket, isInitiator: boolean) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, streamRef.current!);
      });
    }

    if (isInitiator) {
      peer.onnegotiationneeded = async () => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('offer', { roomId, offer });
      };
    }

    return peer;
  };

  const toggleScreenShare = async () => {
    try {
      if (!sharingScreen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        
        const peer = peerRef.current;
        if (peer && streamRef.current) {
          const sender = peer.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        videoTrack.onended = () => {
          stopScreenShare();
        };

        setSharingScreen(true);
      } else {
        stopScreenShare();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const peer = peerRef.current;
      if (peer) {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }
      setSharingScreen(false);
    }
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--color-surface-1)', borderBottom: '1px solid var(--color-border)', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"/><rect x="3" y="6" width="12" height="12" rx="2" ry="2"/></svg>
          Collab Mode (Room {roomId})
        </h3>
        {!inCall ? (
          <button onClick={startCall} style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Start Video Call</button>
        ) : (
          <button onClick={toggleScreenShare} style={{ background: sharingScreen ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: sharingScreen ? '#FCA5A5' : '#34D399', border: `1px solid ${sharingScreen ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            {sharingScreen ? 'Stop Screen Share' : 'Share Screen'}
          </button>
        )}
      </div>

      {inCall && (
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, aspectRatio: '16/9', background: 'rgba(0,0,0,0.5)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
            <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: '0.7rem', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4 }}>You</div>
          </div>
          <div style={{ flex: 1, aspectRatio: '16/9', background: 'rgba(0,0,0,0.5)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: '0.7rem', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4 }}>Friend</div>
          </div>
        </div>
      )}
    </div>
  );
}
