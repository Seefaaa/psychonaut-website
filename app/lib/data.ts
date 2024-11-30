import type { Player } from "@/app/lib/definitions";
import headers from "@/app/lib/headers";

const revalidate = 3_600; // 1 hour

const player_url = process.env.NEXT_PUBLIC_API_URL + '/v2/player?ckey=';
const characters_url = process.env.NEXT_PUBLIC_API_URL + '/v2/player/characters?ckey=';
const roletime_url = process.env.NEXT_PUBLIC_API_URL + '/v2/player/roletime?ckey=';
const activity_url = process.env.NEXT_PUBLIC_API_URL + '/v2/player/activity?ckey=';
const bans_url = process.env.NEXT_PUBLIC_API_URL + '/v2/player/ban?permanent=true&since=2023-08-23%2023:59:59&ckey=';

export async function getPlayer(ckey: string): Promise<Player> {
	const playerPromise = fetch(player_url + ckey, { headers, next: { revalidate } });
	const charactersPromise = fetch(characters_url + ckey, { headers, next: { revalidate } });
	const roletimePromise = fetch(roletime_url + ckey, { headers, next: { revalidate } });
	const activityPromise = fetch(activity_url + ckey, { headers, next: { revalidate } });
	const bansPromise = fetch(bans_url + ckey, { headers, next: { revalidate } });

	const [
		playerResponse, charactersResponse,
		roletimeResponse, activityResponse,
		bansResponse
	] = await Promise.all([
		playerPromise, charactersPromise,
		roletimePromise, activityPromise,
		bansPromise
	]);

	if (!(
		playerResponse.ok && charactersResponse.ok &&
		roletimeResponse.ok && activityResponse.ok &&
		bansResponse.ok
	)) {
		if (playerResponse.status === 404) {
			return null;
		}

		throw new Error('Internal API Error');
	}

	const [
		player, characters,
		roletime, activity,
		bans
	] = await Promise.all([
		playerResponse.json(), charactersResponse.json(),
		roletimeResponse.json(), activityResponse.json(),
		bansResponse.json()
	]);

	delete bans.edits;

	return {
		...player,
		characters,
		roletime,
		activity,
		bans,
	};
}
