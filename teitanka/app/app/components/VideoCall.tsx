'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';

interface VideoCallProps {
  roomId: string;
  userName: string;
  initialRoomUrl?: string;
}

interface Participant {
  session_id: string;
  user_name: string;
  local: boolean;
  video: boolean;
  audio: boolean;
  tracks: {
    video: { persistentTrack?: MediaStreamTrack; track?: MediaStreamTrack; state: string };
    audio: { persistentTrack?: MediaStreamTrack; track?: MediaStreamTrack; state: string };
    screenVideo?: { persistentTrack?: MediaStreamTrack; track?: MediaStreamTrack; state: string };
  };
}

function VideoTile({ participant, updateKey }: { participant: Participant; updateKey: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = participant.tracks?.video?.state === 'playable';

  useEffect(() => {
    if (!videoRef.current) return;
    const track = participant.tracks?.video?.persistentTrack || participant.tracks?.video?.track;
    if (track && hasVideo) {
      const stream = new MediaStream([track]);
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.srcObject = null;
    }
  }, [participant.tracks?.video?.persistentTrack, participant.tracks?.video?.track, hasVideo, updateKey]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.local}
        className={`w-full h-full object-cover ${hasVideo ? '' : 'hidden'}`}
      />
      {!hasVideo && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
            {(participant.user_name || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
        <span>{participant.local ? 'You' : participant.user_name || 'Guest'}</span>
        {participant.tracks?.audio?.state !== 'playable' && (
          <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        )}
      </div>
    </div>
  );
}

export default function VideoCall({ roomId, userName, initialRoomUrl }: VideoCallProps) {
  const [callState, setCallState] = useState<'idle' | 'joining' | 'joined' | 'error'>('idle');
  const [participants, setParticipants] = useState<Record<string, Participant>>({});
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [roomUrl, setRoomUrl] = useState(initialRoomUrl || '');
  const [updateKey, setUpdateKey] = useState(0);
  const callRef = useRef<DailyCall | null>(null);

  const updateParticipants = useCallback((callObject: DailyCall) => {
    const p = callObject.participants();
    const mapped: Record<string, Participant> = {};
    for (const [key, val] of Object.entries(p)) {
      mapped[key] = { ...val } as unknown as Participant;
    }
    setParticipants(mapped);
    setUpdateKey((k) => k + 1);
  }, []);

  const createRoom = async (): Promise<string> => {
    const res = await fetch('/api/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName: `lesson-${roomId}` }),
    });
    if (!res.ok) {
      throw new Error('Failed to create room');
    }
    const data = await res.json();
    return data.url;
  };

  const joinCall = async () => {
    setCallState('joining');
    setErrorMsg('');

    try {
      let url = roomUrl;
      if (!url) {
        url = await createRoom();
        setRoomUrl(url);
      }

      const callObject = DailyIframe.createCallObject({
        url,
        userName,
      });
      callRef.current = callObject;

      callObject.on('joined-meeting', () => {
        setCallState('joined');
        updateParticipants(callObject);
      });
      callObject.on('participant-joined', () => updateParticipants(callObject));
      callObject.on('participant-updated', () => updateParticipants(callObject));
      callObject.on('participant-left', () => updateParticipants(callObject));
      callObject.on('track-started', () => updateParticipants(callObject));
      callObject.on('track-stopped', () => updateParticipants(callObject));
      callObject.on('error', (e) => {
        setErrorMsg(e?.errorMsg || 'Call error');
        setCallState('error');
      });
      callObject.on('left-meeting', () => {
        setCallState('idle');
        setParticipants({});
      });

      await callObject.join();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to join';
      setErrorMsg(msg);
      setCallState('error');
    }
  };

  const leaveCall = async () => {
    if (callRef.current) {
      await callRef.current.leave();
      callRef.current.destroy();
      callRef.current = null;
    }
    setCallState('idle');
    setParticipants({});
  };

  const toggleMic = () => {
    if (callRef.current) {
      callRef.current.setLocalAudio(!isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCam = () => {
    if (callRef.current) {
      callRef.current.setLocalVideo(!isCamOn);
      setIsCamOn(!isCamOn);
    }
  };

  const toggleScreenShare = async () => {
    if (!callRef.current) return;
    if (isScreenSharing) {
      callRef.current.stopScreenShare();
    } else {
      callRef.current.startScreenShare();
    }
    setIsScreenSharing(!isScreenSharing);
  };

  const hasAutoJoined = useRef(false);
  useEffect(() => {
    if (initialRoomUrl && !hasAutoJoined.current) {
      hasAutoJoined.current = true;
      joinCall();
    }
  }, [initialRoomUrl]);

  useEffect(() => {
    return () => {
      if (callRef.current) {
        callRef.current.leave();
        callRef.current.destroy();
      }
    };
  }, []);

  const participantList = Object.values(participants);

  if (callState === 'idle' || callState === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-b-xl">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl mx-auto mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={roomUrl}
              onChange={(e) => setRoomUrl(e.target.value)}
              placeholder="Daily room URL (leave empty to auto-create)"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            onClick={joinCall}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Join Video Call
          </button>

          {errorMsg && (
            <p className="text-red-400 text-sm mt-3">{errorMsg}</p>
          )}
          <p className="text-gray-400 text-sm mt-3">
            Powered by Daily.co
          </p>
        </div>
      </div>
    );
  }

  if (callState === 'joining') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-b-xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Joining call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 rounded-b-xl overflow-hidden">
      {/* Video Grid */}
      <div className="flex-1 p-3 overflow-auto">
        <div
          className={`grid gap-3 h-full ${
            participantList.length === 1
              ? 'grid-cols-1'
              : participantList.length <= 4
              ? 'grid-cols-2'
              : 'grid-cols-3'
          }`}
        >
          {participantList.map((p) => (
            <VideoTile key={p.session_id} participant={p} updateKey={updateKey} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 p-4 bg-gray-800/80">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            isMicOn ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
          title={isMicOn ? 'Mute' : 'Unmute'}
        >
          {isMicOn ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleCam}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            isCamOn ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
          title={isCamOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCamOn ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            isScreenSharing ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
          }`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          onClick={leaveCall}
          className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition"
          title="Leave call"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      </div>

      {/* Room URL display */}
      {roomUrl && (
        <div className="px-4 py-2 bg-gray-800 text-center">
          <p className="text-gray-400 text-xs">
            Room: <span className="text-indigo-400 select-all">{roomUrl}</span>
          </p>
        </div>
      )}
    </div>
  );
}
