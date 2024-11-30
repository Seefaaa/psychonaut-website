import type { Metadata } from 'next';

import { description, openGraph, title } from '@/app/metadata';
import ServerList from '@/app/ui/server-list';

// normally there is no need for "- ${title}" part but it's required here
export const metadata: Metadata = {
	title: `Anasayfa – ${title}`,
	description,
	openGraph: {
		...openGraph,
		title: `Anasayfa – ${title}`,
		description,
	},
};

export default function Home() {
	return <ServerList />;
}
