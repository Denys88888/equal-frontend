import Layout from '@/components/Layout';

export default function Clubs() {
  return (
    <Layout title="Clubs">
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <h1 className="text-2xl font-semibold text-[#232323]">Clubs</h1>
        <p className="mt-4 text-base text-center" style={{ color: 'rgba(35,35,35,0.6)' }}>
          Join interest-based communities...
        </p>
      </div>
    </Layout>
  );
}
