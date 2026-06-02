import Layout from '@/components/Layout';

export default function Settings() {
  return (
    <Layout title="Settings" showBack hideFooter>
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <h1 className="text-2xl font-semibold text-[#232323]">Settings</h1>
        <p className="mt-4 text-base text-center" style={{ color: 'rgba(35,35,35,0.6)' }}>
          Privacy controls and account settings...
        </p>
      </div>
    </Layout>
  );
}
