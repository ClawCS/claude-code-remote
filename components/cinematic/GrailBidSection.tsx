import { SITE_LINKS } from "@/lib/cinematic/site";
import styles from "./warm.module.css";

export default function GrailBidSection() {
 return <section id="grailbid" className={styles.grailbid} aria-labelledby="grailbid-title"><div><p className={styles.eyebrow}>Eine neue Welt neben deinem Getränkemarkt</p><h2 id="grailbid-title">Getränke im Korb.<br/>Grails in der Sammlung.</h2><p>Trading Cards bekommen bei uns ihren eigenen Platz. Entdecke GrailBid – unsere eigenständige TCG-Welt für Sammler und Kartenfans.</p><a href={SITE_LINKS.grailbid} target="_blank" rel="noopener noreferrer">Zu GrailBid.com <span aria-hidden="true">↗</span></a><small>Externer TCG-Shop · GrailBid.com befindet sich im Aufbau.</small></div><div className={styles.cardStack} aria-hidden="true"><span>GRAIL<br/>BID</span><span>COLLECT.<br/>CONNECT.</span><span>TCG<br/>ZONE</span></div></section>;
}
