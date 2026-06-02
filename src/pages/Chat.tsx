import { useParams } from 'react-router';
import Layout from '@/components/Layout';

export default function Chat() {
  const { matchId } = useParams<{ matchId: string }>();

  return (
    <Layout title="Chat" showBack hideFooter>
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <h1 className="text-2xl font-semibold text-[#232323]">Chat</h1>
        <p className="mt-4 text-base text-center" style={{ color: 'rgba(35,35,35,0.6)' }}>
          Conversation with match ID: {matchId}
        </p>
      </div>
    </Layout>
  );
}
