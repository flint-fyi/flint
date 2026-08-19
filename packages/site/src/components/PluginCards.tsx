import type { PluginDetails } from "~/data/pluginData";

import { PluginCard } from "./PluginCard";
import styles from "./PluginCards.module.css";

export interface PluginCardsProps {
	plugins: PluginDetails[];
}

export function PluginCards({ plugins }: PluginCardsProps) {
	return (
		<ul className={styles.pluginCards}>
			{plugins.map((data) => (
				<PluginCard key={data.id} data={data} />
			))}
		</ul>
	);
}
