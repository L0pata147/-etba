import type { Platform } from '../types';

/** Úloha „najdi chybu“ – výpis konfigurace se zabudovanou chybou */
export interface TroubleItem {
  id: string;
  platform: Platform;
  title: string;
  /** Co nefunguje */
  symptom: string;
  config: string;
  answer: string;
  wrong: string[];
  /** Vysvětlení a oprava */
  fix: string;
}

export const TROUBLE: TroubleItem[] = [
  // ===== Debian: NFS a GlusterFS =====
  {
    id: 'tr-st-exportfs',
    platform: 'storage',
    title: 'Nenačtené sdílení NFS',
    symptom: 'Klient při připojení hlásí „access denied by server“. Na serveru je sdílení zapsané v /etc/exports.',
    config: 'root@nfs:~# cat /etc/exports\n/mnt/sdileni 192.168.123.0/24(rw,sync,no_subtree_check)\nroot@nfs:~# exportfs -v\nroot@nfs:~#',
    answer: 'sdílení není načtené – po úpravě /etc/exports chybí exportfs -a',
    wrong: ['v /etc/exports chybí port 2049', 'adresář musí být v /srv, ne v /mnt', 'klient musí mít nainstalovaný nfs-kernel-server'],
    fix: 'exportfs -v nic nevypsal, takže server nic nesdílí. Načíst sdílení:\nexportfs -a\nexportfs -v',
  },
  {
    id: 'tr-st-exports-rozsah',
    platform: 'storage',
    title: 'Rozsah klientů v /etc/exports',
    symptom: 'Klient 192.168.123.100 dostane při připojení NFS „access denied by server“, klient 192.168.123.20 se připojí bez problémů.',
    config: 'root@nfs:~# exportfs -v\n/mnt/sdileni  192.168.123.0/26(sync,wdelay,hide,no_subtree_check,sec=sys,rw,secure,no_root_squash,no_all_squash)',
    answer: 'adresa .100 je mimo povolenou síť /26 (ta končí adresou .63)',
    wrong: ['klient .100 musí mít statickou adresu', 'volba rw povoluje jen jednoho klienta', 'chybí volba _netdev'],
    fix: 'Síť 192.168.123.0/26 má adresy .0–.63 (použitelné .1–.62). Pro celou síť povolit 192.168.123.0/24:\n/mnt/sdileni 192.168.123.0/24(rw,sync,no_subtree_check)\nexportfs -a',
  },
  {
    id: 'tr-st-nfs-common',
    platform: 'storage',
    title: 'Připojení NFS na klientovi',
    symptom: 'Po zápisu do /etc/fstab skončí mount -a chybou.',
    config: 'root@klient:~# tail -1 /etc/fstab\n10.0.3.251:/data /mnt/nfs nfs defaults,_netdev 0 0\nroot@klient:~# mount -a\nmount: /mnt/nfs: bad option; for several filesystems (e.g. nfs, cifs) you might need a /sbin/mount.<type> helper program.',
    answer: 'na klientovi chybí balíček nfs-common',
    wrong: ['NFS se nedá připojit přes /etc/fstab', 'místo nfs musí být typ ext4', 'chybí volba x-systemd.automount'],
    fix: 'Pomocný program mount.nfs je v balíčku nfs-common:\napt install nfs-common -y\nmount -a',
  },
  {
    id: 'tr-st-gluster-hosts',
    platform: 'storage',
    title: 'Připojení uzlu do clusteru',
    symptom: 'Na gfs1 skončí gluster peer probe gfs2 chybou, ping gfs2 nefunguje, ping 10.0.3.202 ano.',
    config: 'root@gfs1:~# cat /etc/hosts\n127.0.0.1   localhost\n10.0.3.201  gfs1\n10.0.3.203  gfs3\nroot@gfs1:~# ping -c1 gfs2\nping: gfs2: Name or service not known',
    answer: 'v /etc/hosts na gfs1 chybí záznam pro gfs2',
    wrong: ['na gfs2 musí běžet SSH server', 'peer probe se spouští jen z posledního uzlu', 'gfs2 musí mít stejnou IP jako gfs1'],
    fix: 'Uzly se hledají podle názvu. Doplnit do /etc/hosts na všech uzlech i na klientovi:\n10.0.3.202  gfs2',
  },
  {
    id: 'tr-st-gluster-replica',
    platform: 'storage',
    title: 'Vytvoření replikovaného volume',
    symptom: 'Příkaz pro vytvoření volume skončí chybou a vypíše nápovědu.',
    config: 'root@gfs1:~# gluster peer status\nNumber of Peers: 2\nroot@gfs1:~# gluster volume create vg0 replica 3 transport tcp gfs1:/srv/brick1 gfs2:/srv/brick2 force',
    answer: 'replica 3 potřebuje tři bricky, v příkazu jsou jen dva',
    wrong: ['transport tcp se už nesmí uvádět', 'volume se musí jmenovat gv0', 'force se píše před replica'],
    fix: 'Počet bricků musí být násobkem repliky. Přidat třetí brick:\ngluster volume create vg0 replica 3 transport tcp gfs1:/srv/brick1 gfs2:/srv/brick2 gfs3:/srv/brick3 force',
  },
  {
    id: 'tr-st-gluster-force',
    platform: 'storage',
    title: 'Brick na systémovém disku',
    symptom: 'Vytvoření volume skončí chybou, že brick leží na kořenovém (systémovém) oddílu.',
    config: 'root@gfs1:~# gluster volume create vg0 replica 3 transport tcp gfs1:/srv/brick1 gfs2:/srv/brick2 gfs3:/srv/brick3',
    answer: 'na konci příkazu chybí force',
    wrong: ['bricky musí být v /mnt', 'chybí příkaz gluster volume start', 'replica se zadává až po vytvoření'],
    fix: 'GlusterFS nedoporučuje bricky na systémovém oddílu. Ve škole (bez samostatného disku) se to obchází slovem force:\ngluster volume create vg0 replica 3 transport tcp gfs1:/srv/brick1 gfs2:/srv/brick2 gfs3:/srv/brick3 force',
  },
  // ===== Cloud =====
  {
    id: 'tr-vb-intnet',
    platform: 'virtualbox',
    title: 'Vnitřní síť VirtualBoxu',
    symptom: 'Server ds (192.168.100.10) a klient (192.168.100.20) mají adresy ze stejné sítě, oba jsou ve „Vnitřní síť“, ale nepingnou se. Firewall je povolený.',
    config: '$ VBoxManage showvminfo ds | grep NIC\nNIC 1: ... Attachment: Internal Network \'intnet\'\n$ VBoxManage showvminfo klient | grep NIC\nNIC 1: ... Attachment: Internal Network \'skola\'',
    answer: 'každá VM je v jiné vnitřní síti (intnet × skola)',
    wrong: ['vnitřní síť neumí přenášet ping', 'chybí výchozí brána', 'VM musí být v režimu NAT'],
    fix: 'Vnitřní síť se identifikuje názvem – obě VM musí mít stejný:\nVBoxManage modifyvm klient --intnet1 intnet\n(GUI: Nastavení → Síť → Název: intnet)',
  },
  {
    id: 'tr-dk-port',
    platform: 'docker',
    title: 'Mapování portu',
    symptom: 'Web má být dostupný na http://server:8080, ale prohlížeč hlásí odmítnuté spojení.',
    config: '$ docker run -d --name web -p 80:8080 nginx\n$ docker ps\nPORTS\n0.0.0.0:80->8080/tcp',
    answer: 'porty jsou prohozené – má být -p 8080:80',
    wrong: ['nginx musí běžet s parametrem -it', 'chybí docker pull nginx', 'kontejner se nesmí jmenovat web'],
    fix: 'Zápis je -p HOSTITEL:KONTEJNER a nginx v kontejneru poslouchá na 80:\ndocker rm -f web\ndocker run -d --name web -p 8080:80 nginx',
  },
  {
    id: 'tr-dk-volume',
    platform: 'docker',
    title: 'Ztracená data databáze',
    symptom: 'Po aktualizaci (docker rm a nové spuštění) zmizela celá databáze.',
    config: '$ docker run -d --name db -e MYSQL_ROOT_PASSWORD=heslo mysql:8\n$ docker rm -f db\n$ docker run -d --name db -e MYSQL_ROOT_PASSWORD=heslo mysql:8',
    answer: 'data nebyla ve svazku (volume), smazala se s kontejnerem',
    wrong: ['MySQL 8 neumí ukládat data', 'chybělo mapování portu 3306', 'heslo se musí zadat přes --password'],
    fix: 'Data databáze patří do pojmenovaného svazku:\ndocker run -d --name db -e MYSQL_ROOT_PASSWORD=heslo -v dbdata:/var/lib/mysql mysql:8',
  },
  {
    id: 'tr-hv-switch',
    platform: 'hyperv',
    title: 'Síť virtuálního počítače',
    symptom: 'VM SRV1 se nedostane do internetu ani na hostitele, ostatní VM na stejném přepínači vidí.',
    config: 'PS> Get-VMSwitch\nName     SwitchType\n----     ----------\nLAN      Private\nPS> Get-VMNetworkAdapter -VMName SRV1\nVMName  SwitchName\nSRV1    LAN',
    answer: 'VM je na privátním přepínači – ten propojuje jen VM mezi sebou',
    wrong: ['VM 2. generace nemá síťovou kartu', 'chybí dynamická paměť', 'Hyper-V neumí NAT'],
    fix: 'Pro přístup ven je potřeba externí přepínač (nebo interní + NAT):\nNew-VMSwitch -Name Externi -NetAdapterName Ethernet\nConnect-VMNetworkAdapter -VMName SRV1 -SwitchName Externi',
  },
  {
    id: 'tr-px-migrate',
    platform: 'proxmox',
    title: 'Živá migrace',
    symptom: 'qm migrate 101 pve2 --online skončí chybou, že disk je na lokálním úložišti.',
    config: '# qm config 101\nscsi0: local-lvm:vm-101-disk-0,size=40G\n# pvesm status\nlocal-lvm  lvmthin  active   (jen na uzlu pve1)\nceph-pool  rbd      active   (sdílené)',
    answer: 'disk VM leží na lokálním úložišti, ne na sdíleném',
    wrong: ['VM musí být vypnutá', 'cluster potřebuje 2 uzly', 'Proxmox neumí živou migraci'],
    fix: 'Živá migrace bez kopírování disku potřebuje sdílené úložiště – přesunout disk:\nqm disk move 101 scsi0 ceph-pool\n(nebo migrovat i s diskem: --with-local-disks)',
  },
];
