/**
 * Proměnné v příkazech – části, které se mění podle zadání (adresy, jména serverů a volume, cesty,
 * uživatelé, hesla, domény, čísla VLAN, jména VM). Pevná syntaxe příkazu se nezvýrazní.
 * Pravidla jsou záměrně opatrná: radši něco nezvýraznit, než označit pevnou část příkazu.
 */

export interface Piece {
  text: string;
  /** true = proměnná (hodnota podle zadání) */
  v: boolean;
}

// Pravidla: buď celý nález (bez skupin), nebo jen zachycené skupiny
const RULES: RegExp[] = [
  // IPv4, maska, prefix (0.0.0.0 a 255.255.255.255 jsou pevné)
  /(?<![\w.])(?!0\.0\.0\.0(?![\d/]))(?!255\.255\.255\.255(?![\d/]))(?!127\.)\d{1,3}(?:\.\d{1,3}){3}(?:\/\d{1,2})?(?![\w.])/g,
  // IPv6 (aspoň „::“ nebo 3 dvojtečky) a MAC adresy
  /(?<![\w:])(?=[0-9a-fA-F:]*::|(?:[0-9a-fA-F]{1,4}:){3})(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(?:\/\d{1,3})?(?![\w:])/g,
  // host:/cesta (NFS, GlusterFS)
  /(?<![\w/]|-v[ \t]+|-[ \t]+)([A-Za-z][\w.-]*):(\/(?!\/)[\w./-]*)/g,
  // jméno svazku v docker-compose („- dbdata:/var/lib/mysql“)
  /^[ \t]*-[ \t]+([A-Za-z][\w.-]*):\//gm,
  // cesty, které si volíš (přípojné body, sdílené a datové adresáře)
  /(?<![\w./])\/(?:mnt|srv|data|export|share|backup|gluster)(?:\/[\w.@-]+)*\/?/g,
  /(?<![\w/])\/home\/[\w.-]+(?:\/[\w.@-]+)*/g,
  // domény a doménové účty
  /(?<![\w./-])(?!jail\.local)(?:[\w-]+\.)+(?:local|lan|lab)(?![\w-]|\.\w)/g,
  /(?<![\w\\])[A-Z][A-Z0-9-]+\\[\w.]+/g,
  // Cisco IOS
  /\bhostname[ \t]+(\S+)/g,
  /\benable[ \t]+(?:secret|password)[ \t]+(?:\d[ \t]+)?(\S+)/g,
  /^[ \t]*password[ \t]+(\S+)/gm,
  /\busername[ \t]+(\S+)(?:[ \t]+(?:privilege[ \t]+\d+[ \t]+)?(?:secret|password)[ \t]+(?:\d[ \t]+)?(\S+))?/g,
  /\bip[ \t]+domain[- ]name[ \t]+(\S+)/g,
  /\bip[ \t]+dhcp[ \t]+pool[ \t]+(\S+)/g,
  /^[ \t]*name[ \t]+(\S+)/gm,
  /\bdescription[ \t]+([^\n]+)/g,
  /\b(?:access|native)?[ \t]*vlan[ \t]+(\d+(?:,\d+)*)/g,
  /\bdot1Q[ \t]+(\d+)/g,
  /\binterface[ \t]+vlan[ \t]*(\d+)/gi,
  /\brouter[ \t]+ospf[ \t]+(\d+)/g,
  // Linux
  /\bset-hostname[ \t]+(\S+)/g,
  /\b(?:useradd|adduser|groupadd|userdel|groupdel|passwd)\b[^\n]*?[ \t]([\w.-]+)[ \t]*$/gm,
  /\busermod[ \t]+-a?G[ \t]+(?!(?:sudo|www-data|docker|adm|wheel)\b)(\S+)[ \t]+(\S+)/g,
  /\busermod[ \t]+-a?G[ \t]+(?:sudo|www-data|docker|adm|wheel)[ \t]+(\S+)/g,
  /\bgpasswd[ \t]+-a[ \t]+(\S+)[ \t]+(\S+)/g,
  /\bchown[ \t]+(?:-R[ \t]+)?([\w.-]+(?::[\w.-]+)?)[ \t]/g,
  /\bchgrp[ \t]+(?:-R[ \t]+)?([\w.-]+)[ \t]/g,
  /\bgluster[ \t]+peer[ \t]+(?:probe|detach)[ \t]+(\S+)/g,
  /\bgluster[ \t]+volume[ \t]+(?:create|start|stop|info|status|heal|delete|add-brick|remove-brick|set)[ \t]+([\w.-]+)/g,
  /\bdocker[ \t]+volume[ \t]+(?:create|rm|inspect)[ \t]+(\S+)/g,
  /\s--name[ \t=](\S+)/g,
  /\s-v[ \t]+([A-Za-z][\w.-]*):/g,
  // VirtualBox, Proxmox
  /\bVBoxManage[ \t]+(?:modifyvm|startvm|showvminfo|unregistervm|controlvm|storageattach|storagectl|snapshot)[ \t]+("[^"]+"|\S+)/g,
  /\bsnapshot[ \t]+\S+[ \t]+(?:take|restore|delete)[ \t]+(\S+)/g,
  /\s--(?:filename|intnet\d)[ \t]+(\S+)/g,
  /\bqm[ \t]+(?:create|start|stop|shutdown|clone|snapshot|template|set|destroy|rollback|config)[ \t]+(\d+)(?:[ \t]+(\d+|[A-Za-z][\w.-]*))?/g,
  // PowerShell (Hyper-V) – jména VM, přepínačů, uzlů; název funkce ve Install-WindowsFeature je pevný
  /-(?:VMName|SwitchName|SnapshotName|Node|StaticAddress|NewVHDPath)[ \t]+([^\s)]+)/g,
  /(?<!Install-WindowsFeature[ \t]+|Feature[ \t]+)-Name[ \t]+(\S+)/g,
  // Windows GUI – hodnoty za popiskem
  /(?:Název kořenové domény|Název počítače|VM Name|přihlašovací jméno|Organizační jednotka|Domény|Name):[ \t]*([^\s·→,()]+)/g,
  // další jména a hodnoty ze zadání
  /\bbanner[ \t]+motd[ \t]+[^\s\w](.+?)[^\s\w][ \t]*$/gm,
  /^[ \t]*(?:\d{1,3}(?:\.\d{1,3}){3}|\d{1,3}(?:\.\d{1,3}){2}\.[xyzX])[ \t]+([A-Za-z][\w.-]*)/gm,
  /(?<![\w.])\d{1,3}(?:\.\d{1,3}){2}\.[xyzX](?![\w.])/g,
  /\b([a-z][\w.-]*)@(?=\d{1,3}\.)/g,
  /\bsmbpasswd[ \t]+-a[ \t]+(\S+)/g,
  /[ \t]-U[ \t]+(\S+)/g,
  /\busermod[ \t]+-[LU][ \t]+(\S+)/g,
  /\bid[ \t]+([\w.-]+)[ \t]*$/gm,
  /\bAllow(?:Users|Groups)[ \t]+([^\n#]+)/g,
  /\bvalid users[ \t]*=[ \t]*@?([\w-]+)/g,
  /\bdocker[ \t]+(?:stop|start|restart|rm|logs|inspect|exec(?:[ \t]+-\w+)*)[ \t]+([A-Za-z][\w.-]*)/g,
  /\bdocker[ \t]+build[ \t]+-t[ \t]+(\S+)/g,
  /\bdocker[ \t]+network[ \t]+create[ \t]+(\S+)/g,
  /\bkubectl[ \t]+scale[ \t]+deployment[ \t]+(\S+)/g,
  /_(?:PASSWORD|DATABASE|USER):[ \t]*(\S+)/g,
  /\bCREATE[ \t]+(?:DATABASE|USER)[ \t]+'?([\w.-]+)'?/g,
  /\bIDENTIFIED[ \t]+BY[ \t]+'([^']+)'/g,
  /\bON[ \t]+(\w+)\.\*[ \t]+TO[ \t]+'([^']+)'/g,
  /\bVBoxManage[ \t]+export[ \t]+(\S+)/g,
  /[ \t]--output[ \t]+(\S+)/g,
  /-Path[ \t]+([^\s)]+)/g,
  /\bqm[ \t]+migrate[ \t]+(\d+)[ \t]+(\S+)/g,
  /\bpct[ \t]+(?:start|stop|enter|create|destroy|snapshot)[ \t]+(\d+)/g,
  /\bvzdump[ \t]+(\d+)/g,
  /\bpvecm[ \t]+(?:create|add)[ \t]+(\S+)/g,
  /\bvm:(\d+)/g,
  /\\\\[\w.-]+\\[\w$.-]+/g,
  /(?<![\p{L}])(?:vybrat server|OU|skupinu)[ \t]+(?!musel\b|být\b)([\p{Lu}][\p{L}\d_-]*|[\p{L}][\p{L}\d_-]*(?=[ \t]*→))/gu,
  /Nová složka:[ \t]*([^\s·→,()]+)/g,
];

/** Rozdělí text příkazu na pevné části a proměnné */
export function splitVars(text: string): Piece[] {
  const mark = new Array<boolean>(text.length).fill(false);
  for (const re of RULES) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const start = m.index ?? 0;
      if (m.length === 1) {
        for (let i = start; i < start + m[0].length; i++) mark[i] = true;
        continue;
      }
      // jen zachycené skupiny (hledají se postupně v nálezu)
      let from = 0;
      for (let g = 1; g < m.length; g++) {
        const val = m[g];
        if (!val) continue;
        const at = m[0].indexOf(val, from);
        if (at < 0) continue;
        for (let i = start + at; i < start + at + val.length; i++) mark[i] = true;
        from = at + val.length;
      }
    }
  }
  const out: Piece[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = out[out.length - 1];
    if (last && last.v === mark[i]) last.text += text[i];
    else out.push({ text: text[i], v: mark[i] });
  }
  return out;
}

/** Jen proměnné (pro testy a přehled) */
export const varsOf = (text: string) =>
  splitVars(text)
    .filter((p) => p.v)
    .map((p) => p.text.trim())
    .filter(Boolean);
