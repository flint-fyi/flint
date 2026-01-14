import { ColoredLogo } from "./ColoredLogo";
import { InlineMarkdown } from "./InlineMarkdown";
import styles from "./PluginCard.module.css";
import type { PluginData } from "~/data/pluginData";

export interface PluginCardProps {
	data: PluginData;
}

export function PluginCard({
	data: { colors, description, id, name },
}: PluginCardProps) {
	return (
		<li className={styles.pluginCard}>
			<ColoredLogo colors={colors} />
			<div className={styles.texts}>
				<span className={styles.name}>
					<a href={`/rules/${id}`}>{name}</a>{" "}
				</span>
				<InlineMarkdown className={styles.description} markdown={description} />
			</div>
		</li>
	);
}
