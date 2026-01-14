import type { PluginData } from "~/data/pluginData";
import { PluginCard } from "./PluginCard";
import styles from "./PluginCards.module.css";

export interface PluginCardsProps {
	plugins: PluginData[];
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
