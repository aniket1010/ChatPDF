import ResponsiveLayout from './ResponsiveLayout';

interface MainLayoutProps {
  filePath: string;
  conversationId: string;
}

export default function MainLayout({ filePath, conversationId }: MainLayoutProps) {
  return <ResponsiveLayout conversationId={conversationId} />;
} 