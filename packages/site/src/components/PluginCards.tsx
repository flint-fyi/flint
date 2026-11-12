import type { PluginDetails } from "~/data/pluginData";
import type { ReactElement } from "react";

import { PluginCard } from "./PluginCard";
import styles from "./PluginCards.module.css";

export interface PluginCardsProps {
	plugins: PluginDetails[];
}

export function PluginCards({ plugins }: PluginCardsProps): ReactElement {
	return (
		<ul className={styles.pluginCards}>
			{plugins.map((data) => (
				<PluginCard data={data} key={data.id} />
			))}
		</ul>
	);
}
