import { topicFor } from '../site/helpers';

const topic = topicFor('cloud');

/** Okruhy z Programového vybavení cloudu (obecný obsah předmětu) */
export const CLOUD_TOPICS = [
  topic(
    1,
    'zaklady',
    'Cloud computing – definice a modely nasazení',
    'Cloud computing je poskytování výpočetních prostředků (servery, úložiště, sítě, aplikace) jako služby přes síť, na vyžádání a s platbou podle spotřeby. Podle NIST má pět základních vlastností a nasazuje se jako veřejný, privátní, hybridní nebo komunitní cloud.',
    [
      ['Vlastnosti cloudu (NIST)', ['samoobsluha na vyžádání (on-demand self-service)', 'široký přístup přes síť', 'sdílení prostředků (resource pooling, multitenance)', 'rychlá elasticita – škálování nahoru i dolů', 'měřená služba – platba podle spotřeby']],
      ['Modely nasazení', ['veřejný cloud – poskytovatel (AWS, Azure, Google Cloud), sdílená infrastruktura', 'privátní cloud – pro jednu organizaci (vlastní datacentrum, např. OpenStack, VMware, Proxmox)', 'hybridní – propojení privátního a veřejného', 'komunitní – sdílený několika organizacemi s podobnými potřebami', 'multicloud – více veřejných poskytovatelů']],
      ['Výhody a nevýhody', ['výhody: žádné počáteční investice (CapEx → OpEx), škálovatelnost, dostupnost, rychlé nasazení', 'nevýhody: závislost na připojení a poskytovateli (vendor lock-in), průběžné náklady, ochrana dat a GDPR, latence']],
    ],
    [
      ['cloud computing', 'Poskytování IT prostředků jako služby přes síť na vyžádání s platbou podle spotřeby.'],
      ['elasticita', 'Schopnost rychle přidávat a ubírat prostředky podle zátěže.'],
      ['multitenance', 'Sdílení stejné infrastruktury více zákazníky oddělenými od sebe.'],
      ['hybridní cloud', 'Kombinace privátního a veřejného cloudu propojených dohromady.'],
      ['vendor lock-in', 'Závislost na jednom poskytovateli, ze kterého je obtížné odejít.'],
      ['OpEx', 'Provozní výdaje – v cloudu se platí průběžně místo nákupu hardwaru (CapEx).'],
    ],
    [
      ['Který model nasazení provozuje jedna organizace pro sebe?', 'privátní cloud', ['veřejný cloud', 'komunitní cloud', 'multicloud']],
      ['Co znamená rychlá elasticita?', 'prostředky lze rychle přidávat i ubírat podle zátěže', ['cloud je levnější', 'data jsou zálohovaná', 'služba je zdarma']],
      ['Co je vendor lock-in?', 'závislost na jednom poskytovateli', ['šifrování dat', 'typ hypervizoru', 'zámek serverovny']],
      ['Jak se mění náklady při přechodu do cloudu?', 'z jednorázových investic (CapEx) na průběžné výdaje (OpEx)', ['náklady vždy zmizí', 'z OpEx na CapEx', 'vůbec se nemění']],
      ['Který z nich je veřejný cloudový poskytovatel?', 'Microsoft Azure', ['Proxmox VE', 'VirtualBox', 'Hyper-V Server']],
    ],
    [
      {
        q: 'Co je cloud computing, jaké má vlastnosti a jaké známe modely nasazení?',
        answer:
          'Cloud computing je poskytování výpočetních prostředků – serverů, úložiště, sítí a aplikací – jako služby přes síť. Podle NIST má pět vlastností: samoobsluhu na vyžádání, široký přístup přes síť, sdílení prostředků mezi zákazníky, rychlou elasticitu a měřenou službu s platbou podle spotřeby. Modely nasazení jsou veřejný cloud (AWS, Azure, Google), privátní cloud pro jednu organizaci, hybridní cloud jako jejich kombinace a komunitní cloud. Výhodou je škálovatelnost a žádné počáteční investice, nevýhodou závislost na poskytovateli a připojení a otázky ochrany dat.',
        points: [
          ['definice – služba přes síť', ['služb', 'síť']],
          ['vlastnosti – samoobsluha, elasticita, měřená služba', ['samoobsl', 'elastic', 'měřen', 'spotřeb']],
          ['veřejný, privátní, hybridní, komunitní', ['veřejn', 'privátn', 'hybridn']],
          ['výhody a nevýhody', ['výhod', 'nevýhod', 'závisl']],
        ],
      },
    ],
  ),
  topic(
    2,
    'sluzby',
    'Modely služeb – IaaS, PaaS, SaaS',
    'Modely služeb se liší tím, kolik vrstev spravuje poskytovatel a kolik zákazník. U IaaS si zákazník pronajímá virtuální servery a stará se o OS a aplikace, u PaaS dostane hotovou platformu pro svůj kód a u SaaS používá hotovou aplikaci. Odpovědnost za bezpečnost je sdílená.',
    [
      ['IaaS – infrastruktura jako služba', ['poskytovatel: hardware, síť, úložiště, virtualizace', 'zákazník: operační systém, middleware, aplikace, data', 'příklady: AWS EC2, Azure Virtual Machines, Google Compute Engine']],
      ['PaaS – platforma jako služba', ['poskytovatel navíc OS a běhové prostředí (runtime, databáze)', 'zákazník nasazuje jen svůj kód a data', 'příklady: Azure App Service, Google App Engine, Heroku, spravované databáze']],
      ['SaaS – software jako služba', ['hotová aplikace v prohlížeči, předplatné', 'zákazník spravuje jen svá data a uživatele', 'příklady: Microsoft 365, Gmail / Google Workspace, Dropbox']],
      ['Další a sdílená odpovědnost', ['FaaS / serverless – spouštění funkcí na událost (AWS Lambda, Azure Functions)', 'CaaS – kontejnery jako služba', 'model sdílené odpovědnosti: poskytovatel za bezpečnost „cloudu“, zákazník za bezpečnost „v cloudu“ (data, účty, konfigurace)']],
    ],
    [
      ['IaaS', 'Infrastruktura jako služba – pronájem virtuálních serverů, sítí a úložiště.'],
      ['PaaS', 'Platforma jako služba – hotové prostředí pro nasazení vlastního kódu.'],
      ['SaaS', 'Software jako služba – hotová aplikace přes internet.'],
      ['serverless', 'Model, kdy zákazník spouští kód bez správy serverů (FaaS).'],
      ['sdílená odpovědnost', 'Rozdělení odpovědnosti za bezpečnost mezi poskytovatele a zákazníka.'],
    ],
    [
      ['Do kterého modelu patří Microsoft 365?', 'SaaS', ['IaaS', 'PaaS', 'FaaS']],
      ['Do kterého modelu patří virtuální server AWS EC2?', 'IaaS', ['SaaS', 'PaaS', 'CaaS']],
      ['Kdo se u IaaS stará o operační systém?', 'zákazník', ['poskytovatel', 'nikdo', 'výrobce hardwaru']],
      ['Co je typické pro PaaS?', 'zákazník nasazuje jen svůj kód, platformu spravuje poskytovatel', ['zákazník si instaluje OS', 'zákazník používá hotovou aplikaci', 'zákazník kupuje hardware']],
      ['Co je AWS Lambda?', 'služba serverless (FaaS)', ['virtuální server', 'úložiště souborů', 'e-mailová služba']],
    ],
    [
      {
        q: 'Porovnej IaaS, PaaS a SaaS a uveď příklady.',
        answer:
          'Liší se tím, které vrstvy spravuje poskytovatel. U IaaS poskytovatel zajišťuje hardware, síť, úložiště a virtualizaci a zákazník si spravuje operační systém, aplikace a data – například AWS EC2 nebo virtuální počítače v Azure. U PaaS poskytovatel spravuje i OS a běhové prostředí, zákazník nasazuje jen svůj kód a data – Azure App Service, Google App Engine. U SaaS zákazník používá hotovou aplikaci, stará se jen o data a uživatele – Microsoft 365, Gmail. Platí model sdílené odpovědnosti: čím vyšší model, tím méně spravuje zákazník.',
        points: [
          ['IaaS – zákazník spravuje OS', ['iaas', 'ec2', 'virtuáln']],
          ['PaaS – jen kód', ['paas', 'kód', 'app service', 'app engine']],
          ['SaaS – hotová aplikace', ['saas', '365', 'gmail']],
          ['kdo co spravuje / sdílená odpovědnost', ['spravuj', 'odpovědn']],
        ],
      },
    ],
  ),
  topic(
    3,
    'virtualizace',
    'Virtualizace – principy a hypervizory',
    'Virtualizace umožňuje na jednom fyzickém počítači provozovat více izolovaných virtuálních počítačů. Řídí je hypervizor: typ 1 běží přímo na hardwaru, typ 2 jako aplikace v hostitelském OS. Podle toho, zda hostovaný systém ví o virtualizaci, rozlišujeme plnou virtualizaci a paravirtualizaci; dnes je běžná hardwarově asistovaná virtualizace (VT-x, AMD-V).',
    [
      ['Pojmy', ['hostitel (host) – fyzický stroj, host (guest) – virtuální počítač', 'hypervizor (VMM) – přiděluje VM procesor, paměť, disky a síť', 'výhody: konsolidace serverů, izolace, snapshoty, snadná migrace a záloha, rychlé nasazení']],
      ['Typy hypervizorů', ['typ 1 (bare-metal, nativní) – přímo na hardwaru: VMware ESXi, Microsoft Hyper-V, KVM (Proxmox), Xen', 'typ 2 (hostovaný) – aplikace v OS: VirtualBox, VMware Workstation', 'typ 1 má vyšší výkon a je pro servery; typ 2 pro testování a výuku']],
      ['Druhy virtualizace', ['plná virtualizace – hostovaný OS nemusí být upraven, hypervizor emuluje / překládá', 'paravirtualizace – hostovaný OS je upravený a volá hypervizor přímo (hypercalls), ovladače virtio', 'hardwarově asistovaná – procesor s VT-x / AMD-V, paměť EPT / NPT, I/O IOMMU (VT-d)', 'kontejnerová (OS-level) – sdílené jádro, ne plné VM']],
      ['Další virtualizace', ['virtualizace úložiště, sítě (SDN), desktopů (VDI) a aplikací', 'vnořená virtualizace – hypervizor uvnitř VM']],
    ],
    [
      ['hypervizor', 'Software, který vytváří a řídí virtuální počítače.'],
      ['hypervizor typu 1', 'Běží přímo na hardwaru (ESXi, Hyper-V, KVM).'],
      ['hypervizor typu 2', 'Běží jako aplikace v hostitelském OS (VirtualBox).'],
      ['paravirtualizace', 'Hostovaný OS je upravený a spolupracuje s hypervizorem.'],
      ['VT-x / AMD-V', 'Rozšíření procesorů pro hardwarovou podporu virtualizace.'],
      ['konsolidace', 'Sloučení více fyzických serverů do VM na menším počtu hostitelů.'],
      ['VDI', 'Virtualizace desktopů – uživatelé pracují ve virtuálních počítačích v datacentru.'],
    ],
    [
      ['Který hypervizor je typu 2?', 'VirtualBox', ['VMware ESXi', 'Hyper-V', 'KVM']],
      ['Co je typické pro paravirtualizaci?', 'hostovaný OS je upravený a volá hypervizor přímo', ['hostovaný OS neví o virtualizaci', 'běží bez hypervizoru', 'používá jen kontejnery']],
      ['Co musí podporovat procesor pro hardwarovou virtualizaci?', 'VT-x nebo AMD-V', ['Hyper-Threading', 'AVX', 'Turbo Boost']],
      ['Kde běží hypervizor typu 1?', 'přímo na hardwaru', ['jako aplikace ve Windows', 'v prohlížeči', 'v kontejneru']],
      ['Co je hlavní výhodou konsolidace serverů?', 'lepší využití hardwaru a nižší náklady', ['vyšší spotřeba', 'víc fyzických serverů', 'není potřeba zálohovat']],
    ],
    [
      {
        q: 'Vysvětli typy hypervizorů a druhy virtualizace.',
        answer:
          'Hypervizor typu 1 (bare-metal) běží přímo na hardwaru a má nejvyšší výkon – VMware ESXi, Hyper-V, KVM v Proxmoxu, Xen; používá se na serverech. Typ 2 je aplikace v hostitelském operačním systému – VirtualBox, VMware Workstation – vhodný pro testování. Při plné virtualizaci hostovaný OS není upravený a hypervizor mu emuluje hardware. Při paravirtualizaci je hostovaný OS upravený nebo používá paravirtualizované ovladače (virtio) a komunikuje s hypervizorem přímo, což je rychlejší. Dnes se využívá hardwarově asistovaná virtualizace díky rozšířením VT-x a AMD-V a stránkování EPT/NPT.',
        points: [
          ['typ 1 bare-metal – ESXi, Hyper-V, KVM', ['typ 1', 'bare', 'esxi', 'kvm']],
          ['typ 2 hostovaný – VirtualBox', ['typ 2', 'virtualbox', 'hostovan']],
          ['plná virtualizace', ['pln', 'emul']],
          ['paravirtualizace, virtio', ['paravirt', 'virtio']],
          ['HW asistovaná VT-x/AMD-V', ['vt-x', 'amd-v', 'hardwar']],
        ],
      },
    ],
  ),
  topic(
    4,
    'platformy',
    'Virtualizační platformy (Hyper-V, VMware, Proxmox)',
    'Mezi nejpoužívanější serverové virtualizační platformy patří Microsoft Hyper-V, VMware vSphere (ESXi + vCenter) a Proxmox VE (KVM + LXC). Liší se správou, licencováním a funkcemi, ale nabízejí podobné možnosti: virtuální sítě, snapshoty, živou migraci, clustery a vysokou dostupnost.',
    [
      ['Microsoft Hyper-V', ['role ve Windows Serveru (i Windows 10/11 Pro)', 'správa: Správce Hyper-V, PowerShell, Windows Admin Center, SCVMM', 'VM 1. generace (BIOS) × 2. generace (UEFI, Secure Boot)', 'disky VHDX, kontrolní body, živá migrace, failover cluster, replikace']],
      ['VMware vSphere', ['ESXi – hypervizor typu 1, vCenter – centrální správa', 'vMotion (živá migrace), Storage vMotion, HA, DRS (vyvažování zátěže), FT', 'disky VMDK, datastore (VMFS, NFS)']],
      ['Proxmox VE', ['open source, Debian + KVM/QEMU a kontejnery LXC', 'webové rozhraní (port 8006), příkazy qm a pct', 'cluster (corosync, pvecm), HA, Ceph, zálohy vzdump / Proxmox Backup Server', 'disky qcow2 / raw, mosty vmbr0']],
      ['VirtualBox', ['hypervizor typu 2 od Oracle, zdarma, Windows / Linux / macOS', 'disky VDI (i VMDK, VHD), dynamicky alokované × pevná velikost', 'sítě: NAT, Síť NAT, Síťový most, Vnitřní síť, Jen hostitel', 'snímky, klonování, export/import OVA, přídavky pro hosta (Guest Additions)', 'správa z GUI nebo příkazem VBoxManage']],
      ['Další', ['KVM / libvirt (virsh), Xen / XCP-ng, Nutanix', 'desktopové: VirtualBox, VMware Workstation, Hyper-V na Windows']],
    ],
    [
      ['Hyper-V', 'Hypervizor typu 1 od Microsoftu, role Windows Serveru.'],
      ['vCenter', 'Centrální správa hostitelů ESXi ve VMware vSphere.'],
      ['vMotion', 'Živá migrace VM mezi hostiteli ve VMware.'],
      ['Proxmox VE', 'Open-source virtualizační platforma postavená na KVM a LXC.'],
      ['LXC', 'Linuxové systémové kontejnery (sdílené jádro).'],
      ['VHDX', 'Formát virtuálního disku Hyper-V.'],
      ['qcow2', 'Formát virtuálního disku QEMU/KVM s podporou snapshotů.'],
      ['DRS', 'Distributed Resource Scheduler – automatické vyvažování zátěže VM ve VMware.'],
    ],
    [
      ['Jaký formát disku používá Hyper-V?', 'VHDX', ['VMDK', 'qcow2', 'ISO']],
      ['Na jakém hypervizoru je postaven Proxmox VE?', 'KVM', ['Hyper-V', 'ESXi', 'Xen']],
      ['Jak se ve VMware jmenuje živá migrace VM?', 'vMotion', ['Live Migration', 'qm migrate', 'DRS']],
      ['Čím se liší VM 2. generace v Hyper-V?', 'používá UEFI a podporuje Secure Boot', ['má víc paměti', 'je jen pro Linux', 'nemá síťovou kartu']],
      ['Na jakém portu běží webové rozhraní Proxmoxu?', '8006', ['443', '8080', '3389']],
      ['K čemu slouží přídavky pro hosta (Guest Additions) ve VirtualBoxu?', 'ovladače pro lepší grafiku, myš, sdílenou schránku a složky', ['k zálohování VM', 'k připojení do domény', 'k šifrování disku']],
      ['Jaký formát virtuálního disku používá VirtualBox jako výchozí?', 'VDI', ['VHDX', 'qcow2', 'ISO']],
      ['Co je vCenter?', 'centrální správa hostitelů ESXi', ['typ virtuálního disku', 'kontejner', 'záložní software']],
    ],
    [
      {
        q: 'Porovnej Hyper-V a Proxmox VE.',
        answer:
          'Hyper-V je hypervizor typu 1 od Microsoftu, instaluje se jako role Windows Serveru a spravuje se Správcem Hyper-V, PowerShellem nebo Windows Admin Center; licencuje se s Windows Serverem. Používá disky VHDX, VM 1. a 2. generace, kontrolní body, živou migraci a vysokou dostupnost přes failover cluster. Proxmox VE je open source na Debianu, používá KVM pro virtuální počítače a LXC pro kontejnery, spravuje se webovým rozhraním nebo příkazy qm a pct, disky qcow2 nebo raw, sítě přes linuxové mosty vmbr. Cluster vytvoří pvecm, nabízí HA, Ceph a zálohy vzdump. Placená je jen podpora.',
        points: [
          ['Hyper-V – role Windows Serveru, PowerShell', ['hyper-v', 'windows', 'powershell']],
          ['VHDX, generace, failover cluster', ['vhdx', 'generac', 'cluster']],
          ['Proxmox – open source, KVM + LXC', ['proxmox', 'kvm', 'lxc', 'open']],
          ['webové rozhraní, qm/pct', ['web', 'qm', 'pct']],
          ['licence', ['licen', 'zdarma', 'podpor']],
        ],
      },
    ],
  ),
  topic(
    5,
    'site',
    'Virtuální sítě',
    'Virtuální počítače se připojují k virtuálním přepínačům, které mohou být propojené s fyzickou sítí, jen s hostitelem, nebo úplně izolované. Virtuální sítě podporují VLAN, NAT i směrování; ve velkém se používá softwarově definovaná síť (SDN).',
    [
      ['Režimy připojení VM (desktopové hypervizory, např. VirtualBox)', ['NAT – VM jde ven přes adresu hostitele, z vnější sítě není přímo dostupná', 'Síť NAT – více VM ve společné síti s přístupem ven', 'bridged (síťový most) – VM je v síti jako samostatný počítač s vlastní adresou', 'host-only (jen hostitel) – komunikace jen s hostitelem a dalšími VM', 'vnitřní (interní) síť – jen mezi VM se stejným názvem sítě, bez hostitele a bez přístupu ven']],
      ['Virtuální přepínače', ['Hyper-V: External (přes fyzický adaptér), Internal (VM + hostitel), Private (jen VM)', 'Proxmox: linuxový most vmbr0 navázaný na fyzické rozhraní, VLAN aware', 'VMware: vSwitch / distribuovaný vSwitch, port groups']],
      ['Pokročilé', ['VLAN tagování na virtuálních portech', 'virtuální router / firewall jako VM (pfSense, OPNsense)', 'SDN – oddělení řídicí a datové roviny, overlay sítě (VXLAN)', 'v cloudu: virtuální síť VPC / VNet, podsítě, bezpečnostní skupiny']],
    ],
    [
      ['virtuální přepínač', 'Softwarový switch, ke kterému se připojují síťové karty VM.'],
      ['bridged', 'Režim, kdy je VM v síti jako samostatné zařízení s vlastní adresou.'],
      ['NAT (u VM)', 'VM sdílí adresu hostitele a z vnější sítě není přímo vidět.'],
      ['host-only', 'Síť jen mezi hostitelem a VM.'],
      ['VPC', 'Virtuální privátní síť v cloudu (AWS; v Azure VNet).'],
      ['SDN', 'Softwarově definovaná síť s centrálním řízením.'],
    ],
    [
      ['Který typ přepínače Hyper-V dovolí VM komunikovat jen mezi sebou?', 'Private', ['External', 'Internal', 'Bridged']],
      ['V jakém režimu dostane VM adresu ze stejné sítě jako fyzické počítače?', 'bridged', ['NAT', 'host-only', 'interní síť']],
      ['Jak se jmenuje výchozí síťový most v Proxmoxu?', 'vmbr0', ['eth0', 'vSwitch0', 'br-lan']],
      ['Který typ přepínače Hyper-V je propojený s fyzickou sítí?', 'External', ['Internal', 'Private', 'NAT']],
      ['Jak se v AWS jmenuje virtuální síť zákazníka?', 'VPC', ['VNet', 'VLAN', 'DMZ']],
      ['Který režim VirtualBoxu použiješ, aby server a klient komunikovaly jen mezi sebou?', 'Vnitřní síť', ['NAT', 'Síťový most', 'Jen hostitel']],
      ['Co musí mít dvě VM ve vnitřní síti VirtualBoxu stejné, aby se viděly?', 'název vnitřní sítě', ['MAC adresu', 'operační systém', 'velikost disku']],
    ],
    [
      {
        q: 'Jaké máme možnosti připojení virtuálních počítačů k síti?',
        answer:
          'VM se připojují k virtuálnímu přepínači. V režimu bridged (externí přepínač) je VM v fyzické síti jako samostatné zařízení s vlastní adresou. V režimu NAT sdílí adresu hostitele, do internetu se dostane, ale zvenku není přímo dostupná. Host-only nebo interní přepínač dovolí komunikaci jen s hostitelem a ostatními VM, privátní přepínač jen mezi VM. V Hyper-V jsou to přepínače External, Internal a Private, v Proxmoxu linuxové mosty vmbr s podporou VLAN. Pro oddělení sítí lze použít VLAN nebo virtuální router či firewall jako VM.',
        points: [
          ['bridged / external', ['bridg', 'extern', 'most']],
          ['NAT', ['nat']],
          ['host-only / internal / private', ['host-only', 'intern', 'privat']],
          ['VLAN, virtuální router', ['vlan', 'router', 'firewall']],
        ],
      },
    ],
  ),
  topic(
    6,
    'uloziste',
    'Úložiště pro virtualizaci a cloud',
    'Virtuální disky jsou soubory nebo bloková zařízení na úložišti hostitele. Pro clustery se používá sdílené úložiště – SAN (iSCSI, Fibre Channel), NAS (NFS, SMB) nebo distribuované úložiště (Ceph, vSAN). V cloudu se rozlišuje blokové, souborové a objektové úložiště.',
    [
      ['Virtuální disky', ['formáty VHDX (Hyper-V), VMDK (VMware), qcow2 / raw (KVM)', 'thin provisioning – disk roste podle potřeby × thick – místo alokované předem', 'rozdílové disky / snapshoty']],
      ['Sdílená úložiště', ['DAS – lokální disky', 'NAS – souborový přístup po síti (NFS, SMB)', 'SAN – blokový přístup: iSCSI (přes Ethernet, target a initiator, LUN), Fibre Channel', 'distribuované – Ceph, VMware vSAN, Storage Spaces Direct']],
      ['Úložiště v cloudu', ['blokové – disky VM (AWS EBS, Azure Managed Disks)', 'souborové – sdílené složky (AWS EFS, Azure Files)', 'objektové – objekty v kontejnerech / bucketech přes HTTP API (AWS S3, Azure Blob), prakticky neomezená kapacita', 'třídy úložiště podle četnosti přístupu (hot, cool, archive)']],
    ],
    [
      ['thin provisioning', 'Virtuální disk zabírá jen tolik místa, kolik dat obsahuje.'],
      ['iSCSI', 'Protokol pro blokový přístup k diskům přes síť TCP/IP.'],
      ['LUN', 'Logická jednotka (disk) poskytovaná úložištěm SAN.'],
      ['objektové úložiště', 'Ukládání dat jako objektů s metadaty, přístup přes HTTP API (S3).'],
      ['Ceph', 'Open-source distribuované úložiště.'],
      ['NFS', 'Síťový souborový systém používaný hlavně v Linuxu.'],
    ],
    [
      ['Jaký přístup poskytuje SAN?', 'blokový', ['souborový', 'objektový', 'webový']],
      ['Co je thin provisioning?', 'disk zabírá jen místo pro skutečná data a roste', ['místo se alokuje celé předem', 'disk je šifrovaný', 'disk je jen pro čtení']],
      ['Která služba je objektové úložiště?', 'Amazon S3', ['Amazon EBS', 'iSCSI LUN', 'NTFS']],
      ['Přes jakou síť funguje iSCSI?', 'přes běžnou síť Ethernet / TCP/IP', ['jen přes Fibre Channel', 'přes USB', 'přes Wi-Fi Direct']],
      ['Jaké riziko má thin provisioning?', 'přeplnění fyzického úložiště při nadměrném přidělení', ['nižší bezpečnost hesel', 'nemožnost zálohy', 'pomalý start VM']],
    ],
    [
      {
        q: 'Jaké typy úložišť se používají ve virtualizaci a v cloudu?',
        answer:
          'Virtuální disk je soubor (VHDX, VMDK, qcow2) nebo blokové zařízení; může být thick s předem alokovaným místem nebo thin, který roste podle dat. Lokální úložiště (DAS) stačí pro jeden hostitel, pro cluster a živou migraci je potřeba sdílené úložiště: NAS se souborovým přístupem (NFS, SMB), SAN s blokovým přístupem (iSCSI, Fibre Channel) nebo distribuované (Ceph, vSAN). V cloudu existuje blokové úložiště pro disky VM (EBS), souborové (EFS, Azure Files) a objektové (S3, Azure Blob), kde se data ukládají jako objekty a přistupuje se k nim přes HTTP API.',
        points: [
          ['formáty disků, thin × thick', ['thin', 'thick', 'vhdx', 'qcow']],
          ['NAS – souborový', ['nas', 'nfs', 'smb', 'soubor']],
          ['SAN – blokový, iSCSI', ['san', 'iscsi', 'blok']],
          ['objektové – S3', ['objekt', 's3', 'blob']],
          ['sdílené pro cluster / migraci', ['sdílen', 'cluster', 'migrac']],
        ],
      },
    ],
  ),
  topic(
    7,
    'zalohy',
    'Snapshoty, zálohování a obnova',
    'Snapshot zachytí stav virtuálního počítače v čase a umožní se k němu vrátit, ale není to záloha – leží na stejném úložišti. Záloha je kopie dat uložená jinde. Strategii zálohování určují požadavky RPO a RTO a pravidlo 3-2-1.',
    [
      ['Snapshot (kontrolní bod)', ['stav disků, případně i paměti VM v daném okamžiku', 'použití: před aktualizací nebo změnou konfigurace', 'není záloha – závisí na původním disku, zpomaluje VM, nemá se držet dlouho', 'Hyper-V: standardní × produkční kontrolní body (VSS uvnitř VM)']],
      ['Zálohování', ['úplná, rozdílová (od poslední úplné), přírůstková (od poslední jakékoli)', 'pravidlo 3-2-1: 3 kopie dat, 2 různá média, 1 mimo lokalitu (a ideálně 1 offline / neměnná)', 'nástroje: Veeam, Windows Server Backup, Proxmox Backup Server / vzdump, cloudové zálohy', 'pravidelné testování obnovy']],
      ['RPO a RTO', ['RPO – kolik dat (času) můžeme ztratit → jak často zálohovat', 'RTO – jak rychle musí být služba znovu v provozu', 'replikace VM (Hyper-V Replica) a disaster recovery do jiné lokality / cloudu']],
    ],
    [
      ['snapshot', 'Zachycený stav VM v čase, ke kterému se lze vrátit.'],
      ['přírůstková záloha', 'Záloha změn od poslední zálohy jakéhokoli typu.'],
      ['rozdílová záloha', 'Záloha změn od poslední úplné zálohy.'],
      ['pravidlo 3-2-1', '3 kopie dat, na 2 různých médiích, 1 mimo lokalitu.'],
      ['RPO', 'Recovery Point Objective – maximální přípustná ztráta dat v čase.'],
      ['RTO', 'Recovery Time Objective – maximální doba obnovy služby.'],
      ['replikace', 'Průběžné kopírování VM na jiný hostitel nebo lokalitu.'],
    ],
    [
      ['Proč snapshot není záloha?', 'leží na stejném úložišti a závisí na původním disku', ['je příliš velký', 'nejde obnovit', 'je jen pro Linux']],
      ['Co udává RPO?', 'kolik dat (času) si můžeme dovolit ztratit', ['jak rychle obnovíme službu', 'cenu zálohy', 'počet záloh']],
      ['Co udává RTO?', 'za jak dlouho musí být služba obnovená', ['kolik dat můžeme ztratit', 'velikost zálohy', 'počet serverů']],
      ['Která záloha obsahuje změny od poslední úplné zálohy?', 'rozdílová', ['přírůstková', 'úplná', 'snapshot']],
      ['Co říká pravidlo 3-2-1?', '3 kopie, 2 různá média, 1 mimo lokalitu', ['3 servery, 2 disky, 1 cloud', 'zálohovat 3× denně', '3 hesla a 2 klíče']],
    ],
    [
      {
        q: 'Navrhni zálohování virtualizované infrastruktury malé firmy.',
        answer:
          'Nejdřív určím RPO a RTO – například denní ztráta dat je přijatelná a obnova do čtyř hodin. Virtuální počítače budu zálohovat na úrovni hypervizoru (Veeam, Proxmox Backup Server, vzdump, Windows Server Backup): jednou týdně úplnou zálohu a denně přírůstkovou. Dodržím pravidlo 3-2-1 – produkční data, záloha na NAS a kopie mimo firmu nebo do cloudu, ideálně neměnná či offline proti ransomwaru. Snapshoty použiji jen krátkodobě před změnami, nejsou to zálohy. Pravidelně budu testovat obnovu a důležité servery případně replikovat na druhý hostitel.',
        points: [
          ['RPO a RTO', ['rpo', 'rto']],
          ['úplná + přírůstková / rozdílová', ['úpln', 'přírůstk', 'rozdíl']],
          ['3-2-1, mimo lokalitu', ['3-2-1', 'mimo', 'cloud', 'offline']],
          ['snapshot není záloha', ['snapshot']],
          ['test obnovy / replikace', ['test', 'obnov', 'replik']],
        ],
      },
    ],
  ),
  topic(
    8,
    'ha',
    'Vysoká dostupnost, clustery a migrace',
    'Vysoká dostupnost (HA) zajišťuje, že služby běží i při výpadku části infrastruktury. Hostitelé se spojují do clusteru se sdíleným úložištěm; při výpadku uzlu se VM automaticky spustí jinde. Živá migrace přesune běžící VM bez výpadku. Zátěž mezi více servery rozděluje load balancer.',
    [
      ['Dostupnost', ['udává se v procentech: 99,9 % ≈ 8,8 h výpadku za rok, 99,99 % ≈ 53 min', 'odstranění jediného bodu selhání (SPOF) – redundance hostitelů, úložiště, sítě, napájení', 'SLA – smlouva o úrovni služby']],
      ['Cluster', ['více uzlů se sdíleným úložištěm', 'kvórum – většina uzlů musí být dostupná (proti split-brain), proto lichý počet / svědek', 'failover – po výpadku uzlu se VM restartují na jiném (krátký výpadek)', 'Hyper-V failover cluster, VMware HA, Proxmox HA (ha-manager)']],
      ['Migrace', ['živá migrace – přesun běžící VM (paměti) mezi hostiteli bez výpadku: Hyper-V Live Migration, vMotion, qm migrate --online', 'migrace úložiště – přesun disků VM', 'offline migrace / export a import']],
      ['Škálování a vyvažování', ['load balancer – rozděluje požadavky mezi servery, kontroluje jejich stav (health check)', 'vertikální škálování (víc CPU/RAM) × horizontální (víc instancí)', 'autoscaling v cloudu', 'zóny dostupnosti a regiony']],
    ],
    [
      ['vysoká dostupnost', 'Schopnost služby běžet i při výpadku části infrastruktury.'],
      ['failover', 'Automatické převzetí služby jiným uzlem po výpadku.'],
      ['živá migrace', 'Přesun běžícího VM na jiného hostitele bez výpadku.'],
      ['kvórum', 'Podmínka, že cluster funguje jen s většinou uzlů (proti split-brain).'],
      ['load balancer', 'Zařízení nebo služba rozdělující zátěž mezi více serverů.'],
      ['SPOF', 'Single Point of Failure – jediný bod, jehož selhání vyřadí celý systém.'],
      ['horizontální škálování', 'Přidání dalších instancí serveru místo zvětšování jednoho.'],
    ],
    [
      ['K čemu slouží kvórum v clusteru?', 'brání split-brain – cluster běží jen s většinou uzlů', ['šifruje komunikaci', 'zrychluje migraci', 'zálohuje VM']],
      ['Co je živá migrace?', 'přesun běžícího VM na jiného hostitele bez výpadku', ['obnova ze zálohy', 'restart VM po výpadku', 'kopírování disku na USB']],
      ['Co dělá load balancer?', 'rozděluje požadavky mezi více serverů', ['zálohuje servery', 'přiděluje IP adresy', 'šifruje disky']],
      ['Co je horizontální škálování?', 'přidání dalších instancí serveru', ['přidání RAM do serveru', 'snížení počtu serverů', 'přesun do jiného regionu']],
      ['Kolik výpadku za rok odpovídá dostupnosti 99,9 %?', 'asi 8,8 hodiny', ['asi 53 minut', 'asi 5 minut', 'asi 3,6 dne']],
      ['Co je podmínkou živé migrace v clusteru?', 'sdílené úložiště nebo migrace i s diskem a rychlá síť', ['vypnutá VM', 'stejné IP adresy hostitelů', 'paravirtualizace']],
    ],
    [
      {
        q: 'Jak zajistíš vysokou dostupnost virtuálních serverů?',
        answer:
          'Odstraním jediné body selhání: použiji alespoň dva, lépe tři hostitele spojené do clusteru, sdílené nebo replikované úložiště (SAN, Ceph), redundantní síť a napájení s UPS. Kvórum (lichý počet uzlů nebo svědek) zabrání split-brain. Při výpadku uzlu cluster automaticky restartuje VM na jiném uzlu (failover, HA – Hyper-V failover cluster, VMware HA, Proxmox ha-manager). Pro plánovanou údržbu použiji živou migraci bez výpadku. Webové služby rozložím na více instancí za load balancer s kontrolou stavu a mohu škálovat horizontálně.',
        points: [
          ['cluster více hostitelů', ['cluster', 'uzl', 'hostitel']],
          ['sdílené úložiště, redundance', ['sdílen', 'redund', 'spof']],
          ['kvórum', ['kvór', 'split']],
          ['failover / HA', ['failover', 'restart', 'převz', 'dostupn']],
          ['živá migrace, load balancer', ['migrac', 'balancer']],
        ],
      },
    ],
  ),
  topic(
    9,
    'kontejnery',
    'Kontejnery a Docker',
    'Kontejner je izolovaný proces s vlastním souborovým systémem, který sdílí jádro hostitelského OS. Je proto lehčí a startuje rychleji než virtuální počítač. Docker vytváří kontejnery z image, které se sestavují podle Dockerfile a ukládají v registrech; víc kontejnerů popisuje Docker Compose.',
    [
      ['Kontejner × VM', ['VM – vlastní jádro OS, hypervizor, větší režie, silnější izolace', 'kontejner – sdílené jádro hostitele, izolace pomocí namespaces a cgroups, start v sekundách, malá velikost', 'kontejnery mohou běžet i uvnitř VM']],
      ['Docker', ['image – šablona pouze pro čtení ve vrstvách', 'kontejner – běžící instance image', 'registr – úložiště image (Docker Hub, privátní registr)', 'Dockerfile – FROM, RUN, COPY, EXPOSE, CMD / ENTRYPOINT']],
      ['Data a síť', ['kontejner je dočasný – data patří do svazků (volumes) nebo bind mountů', 'mapování portů -p hostitel:kontejner', 'sítě: bridge (výchozí), host, vlastní sítě – kontejnery se najdou podle jména']],
      ['Docker Compose', ['soubor compose.yaml popisuje služby, sítě a svazky', 'docker compose up -d / down', 'typicky web + databáze']],
    ],
    [
      ['kontejner', 'Izolovaný proces se sdíleným jádrem hostitele a vlastním souborovým systémem.'],
      ['image', 'Šablona kontejneru pouze pro čtení, složená z vrstev.'],
      ['Dockerfile', 'Textový předpis, jak sestavit image.'],
      ['Docker Hub', 'Veřejný registr image pro Docker.'],
      ['volume', 'Svazek – trvalé úložiště dat kontejneru mimo jeho vrstvu.'],
      ['Docker Compose', 'Nástroj pro definici a spuštění vícekontejnerové aplikace.'],
      ['namespaces', 'Mechanismus jádra Linuxu pro izolaci procesů (síť, PID, souborový systém).'],
      ['cgroups', 'Mechanismus jádra Linuxu pro omezení prostředků (CPU, RAM) procesů.'],
    ],
    [
      ['Co sdílí kontejnery s hostitelem?', 'jádro operačního systému', ['celý souborový systém', 'IP adresu vždy', 'nic']],
      ['Co je image v Dockeru?', 'šablona, ze které se spouští kontejner', ['běžící kontejner', 'síť kontejnerů', 'záloha']],
      ['Kde se ukládají data, aby přežila smazání kontejneru?', 've svazku (volume)', ['ve vrstvě image', 'v proměnné prostředí', 'v Dockerfile']],
      ['Kterou instrukcí Dockerfile začíná?', 'FROM', ['RUN', 'CMD', 'EXPOSE']],
      ['Co znamená -p 8080:80?', 'port 8080 hostitele se přesměruje na port 80 kontejneru', ['port 80 hostitele na 8080 kontejneru', 'kontejner má 8080 MB RAM', 'spustí 80 kontejnerů']],
      ['Jaká je hlavní výhoda kontejnerů oproti VM?', 'menší režie a rychlý start', ['silnější izolace', 'vlastní jádro', 'podpora všech OS']],
    ],
    [
      {
        q: 'Porovnej kontejnery a virtuální počítače.',
        answer:
          'Virtuální počítač má vlastní operační systém i jádro a běží na hypervizoru, který mu emuluje hardware; má větší režii (paměť, disk), startuje v minutách a izolace je silná. Kontejner sdílí jádro hostitelského OS, izolaci zajišťují namespaces a cgroups, obsahuje jen aplikaci a její knihovny, je malý, startuje v sekundách a na jednom serveru jich běží mnohem víc. Nevýhodou je slabší izolace a nutnost stejného typu jádra (linuxové kontejnery na Linuxu). V praxi se kombinují – kontejnery běží ve VM a orchestruje je Kubernetes.',
        points: [
          ['VM – vlastní OS/jádro, hypervizor', ['vlastn', 'jádr', 'hypervizor']],
          ['kontejner – sdílené jádro', ['sdíl', 'jádr']],
          ['namespaces / cgroups', ['namespace', 'cgroup']],
          ['režie a rychlost startu', ['režij', 'start', 'sekund']],
          ['izolace', ['izolac']],
        ],
      },
    ],
  ),
  topic(
    10,
    'kubernetes',
    'Orchestrace kontejnerů – Kubernetes',
    'Kubernetes (K8s) automatizuje nasazování, škálování a správu kontejnerů na clusteru serverů. Požadovaný stav se popisuje deklarativně v souborech YAML a Kubernetes ho sám udržuje – restartuje spadlé kontejnery, rozkládá zátěž a provádí postupné aktualizace.',
    [
      ['Architektura', ['řídicí rovina (control plane): API server, etcd (úložiště stavu), scheduler, controller manager', 'pracovní uzly (nodes): kubelet, kube-proxy, běhové prostředí kontejnerů (containerd)', 'správa příkazem kubectl']],
      ['Objekty', ['pod – nejmenší jednotka, jeden nebo více kontejnerů se sdílenou sítí', 'deployment – požadovaný počet replik, postupné aktualizace (rolling update)', 'service – stálá adresa a vyvažování zátěže pro pody (ClusterIP, NodePort, LoadBalancer)', 'ingress (HTTP přístup zvenku), namespace, ConfigMap, Secret, PersistentVolume']],
      ['Funkce', ['samoopravování – restart a přeplánování podů', 'horizontální škálování (i automatické HPA)', 'spravované služby v cloudu: AKS (Azure), EKS (AWS), GKE (Google)']],
    ],
    [
      ['Kubernetes', 'Platforma pro orchestraci kontejnerů.'],
      ['pod', 'Nejmenší nasaditelná jednotka v Kubernetes – jeden či více kontejnerů.'],
      ['deployment', 'Objekt určující, kolik replik podů má běžet a jak se aktualizují.'],
      ['service', 'Stálý přístupový bod a vyvažování zátěže pro skupinu podů.'],
      ['kubectl', 'Příkazový nástroj pro správu Kubernetes.'],
      ['etcd', 'Distribuované úložiště konfigurace a stavu clusteru Kubernetes.'],
    ],
    [
      ['Co je nejmenší jednotka nasazení v Kubernetes?', 'pod', ['service', 'node', 'namespace']],
      ['Kde Kubernetes ukládá stav clusteru?', 'v etcd', ['v kubelet', 'v Docker Hubu', 'v podu']],
      ['Který objekt udržuje požadovaný počet replik?', 'deployment', ['service', 'ingress', 'ConfigMap']],
      ['Jak se jmenuje spravovaný Kubernetes v Azure?', 'AKS', ['EKS', 'GKE', 'ECS']],
      ['Co zajišťuje service?', 'stálou adresu a vyvažování zátěže pro pody', ['ukládání dat', 'sestavení image', 'zálohování']],
    ],
    [
      {
        q: 'K čemu slouží Kubernetes a jaké jsou jeho základní objekty?',
        answer:
          'Kubernetes orchestruje kontejnery na clusteru serverů: nasazuje je, škáluje, restartuje při selhání, rozkládá zátěž a provádí postupné aktualizace. Požadovaný stav se popisuje deklarativně v YAML a aplikuje příkazem kubectl apply. Řídicí rovina má API server, etcd, scheduler a controller manager, na pracovních uzlech běží kubelet a kube-proxy. Základní objekty: pod (jeden či více kontejnerů), deployment (počet replik a aktualizace), service (stálá adresa a vyvažování), ingress pro HTTP přístup zvenku, ConfigMap a Secret pro konfiguraci a PersistentVolume pro data.',
        points: [
          ['orchestrace – nasazení, škálování, samoopravy', ['orchestr', 'škál', 'restart']],
          ['deklarativně YAML, kubectl', ['yaml', 'kubectl', 'deklarat']],
          ['pod', ['pod']],
          ['deployment, service', ['deployment', 'service']],
          ['control plane / uzly', ['api', 'etcd', 'kubelet', 'uzl']],
        ],
      },
    ],
  ),
  topic(
    11,
    'verejny',
    'Veřejné cloudy – AWS, Azure, Google Cloud',
    'Největšími poskytovateli veřejného cloudu jsou Amazon Web Services, Microsoft Azure a Google Cloud. Nabízejí obdobné služby – virtuální servery, úložiště, databáze, sítě, kontejnery a serverless – rozmístěné v regionech a zónách dostupnosti po celém světě, s platbou podle spotřeby.',
    [
      ['Globální infrastruktura', ['region – geografická oblast s více datacentry (např. Evropa – Frankfurt)', 'zóna dostupnosti – samostatné datacentrum v regionu s nezávislým napájením', 'volba regionu: latence, cena, legislativa (GDPR)']],
      ['Ekvivalentní služby', ['virtuální servery: AWS EC2 × Azure Virtual Machines × Google Compute Engine', 'objektové úložiště: S3 × Azure Blob Storage × Cloud Storage', 'spravované databáze: RDS × Azure SQL Database × Cloud SQL', 'kontejnery: EKS × AKS × GKE; serverless: Lambda × Azure Functions × Cloud Functions', 'identity: AWS IAM × Microsoft Entra ID (Azure AD) × Cloud IAM']],
      ['Cenové modely', ['pay-as-you-go – platba za skutečné použití', 'rezervované instance / úspory za závazek na 1–3 roky', 'spot instance – levná nevyužitá kapacita, může být kdykoli odebrána', 'kalkulačky cen, rozpočty a upozornění, platí se i za odchozí data']],
    ],
    [
      ['region', 'Geografická oblast poskytovatele s více datacentry.'],
      ['zóna dostupnosti', 'Samostatné datacentrum v rámci regionu.'],
      ['EC2', 'Služba virtuálních serverů v AWS.'],
      ['Azure Blob Storage', 'Objektové úložiště v Azure.'],
      ['spot instance', 'Levná nevyužitá kapacita, kterou poskytovatel může kdykoli odebrat.'],
      ['pay-as-you-go', 'Platba jen za skutečně spotřebované prostředky.'],
      ['Microsoft Entra ID', 'Cloudová správa identit Microsoftu (dříve Azure AD).'],
    ],
    [
      ['Jak se jmenuje objektové úložiště v AWS?', 'S3', ['EC2', 'RDS', 'EBS']],
      ['Co je zóna dostupnosti?', 'samostatné datacentrum v rámci regionu', ['země, kde poskytovatel působí', 'virtuální síť', 'cenový plán']],
      ['Která služba Azure odpovídá AWS EC2?', 'Azure Virtual Machines', ['Azure Blob Storage', 'Azure Functions', 'Azure SQL Database']],
      ['Jaké riziko mají spot instance?', 'poskytovatel je může kdykoli odebrat', ['jsou nejdražší', 'nelze je spustit', 'nemají síť']],
      ['Proč nasadit aplikaci do více zón dostupnosti?', 'aby přežila výpadek jednoho datacentra', ['aby byla levnější', 'kvůli rychlejšímu sestavení', 'kvůli licencím']],
    ],
    [
      {
        q: 'Jak bys nasadil webovou aplikaci do veřejného cloudu?',
        answer:
          'Vybral bych region blízko uživatelů a v souladu s GDPR (např. EU). Vytvořil bych virtuální síť (VPC / VNet) s podsítěmi a bezpečnostními skupinami, které povolí jen potřebné porty. Aplikaci bych spustil na virtuálních serverech (EC2 / Azure VM) ve více zónách dostupnosti za load balancerem s automatickým škálováním, případně jako PaaS nebo v kontejnerech. Data uložím do spravované databáze (RDS / Azure SQL) a soubory do objektového úložiště (S3 / Blob). Přístup řídím přes IAM s MFA, nastavím zálohy, monitoring a rozpočet s upozorněním na náklady.',
        points: [
          ['region, GDPR', ['region', 'gdpr']],
          ['VPC / síť a bezpečnostní skupiny', ['vpc', 'vnet', 'síť', 'bezpečnostn']],
          ['VM / PaaS ve více zónách, load balancer', ['zón', 'balancer', 'škál']],
          ['spravovaná DB, objektové úložiště', ['databáz', 's3', 'blob', 'objekt']],
          ['IAM, monitoring, náklady', ['iam', 'monitor', 'náklad', 'rozpoč']],
        ],
      },
    ],
  ),
  topic(
    12,
    'bezpecnost',
    'Bezpečnost a správa identit v cloudu',
    'V cloudu platí model sdílené odpovědnosti: poskytovatel zabezpečuje fyzickou infrastrukturu, zákazník své účty, data, konfiguraci a přístup. Základem je správa identit a přístupu (IAM) s principem nejmenších oprávnění a vícefaktorovým ověřením, šifrování dat a monitoring.',
    [
      ['Identity a přístup', ['IAM – uživatelé, skupiny, role a zásady (policies)', 'princip nejmenších oprávnění, role místo sdílených klíčů', 'MFA, jednotné přihlášení (SSO), podmíněný přístup', 'chránit hlavní (root) účet, nepoužívat ho pro běžnou práci']],
      ['Ochrana dat a sítě', ['šifrování v klidu (at rest) i při přenosu (TLS), správa klíčů (KMS, Key Vault)', 'bezpečnostní skupiny / NSG – firewall pro VM', 'privátní podsítě, VPN nebo dedikované spojení do firmy', 'nepovolovat veřejný přístup k úložišti (únik dat z bucketů)']],
      ['Provoz a soulad', ['logování a audit (CloudTrail, Azure Monitor), upozornění', 'zálohy, aktualizace, skenování zranitelností', 'GDPR – kde jsou data uložena, smlouvy o zpracování', 'nejčastější incidenty: chybná konfigurace, uniklé přístupové klíče, slabá hesla']],
    ],
    [
      ['IAM', 'Identity and Access Management – správa identit a oprávnění.'],
      ['MFA', 'Vícefaktorové ověření – heslo plus další faktor (aplikace, klíč).'],
      ['princip nejmenších oprávnění', 'Každý dostane jen oprávnění nezbytná pro svou práci.'],
      ['šifrování v klidu', 'Šifrování uložených dat na discích a v úložištích.'],
      ['bezpečnostní skupina', 'Pravidla firewallu pro virtuální servery v cloudu.'],
      ['KMS', 'Služba pro správu šifrovacích klíčů.'],
    ],
    [
      ['Za co v IaaS odpovídá zákazník?', 'za OS, aplikace, data a nastavení přístupu', ['za fyzickou bezpečnost datacentra', 'za napájení serverů', 'za nic']],
      ['Co je princip nejmenších oprávnění?', 'každý má jen oprávnění nezbytná pro svou práci', ['všichni jsou administrátoři', 'hesla mají min. 8 znaků', 'nikdo nemá přístup']],
      ['Co je nejčastější příčinou úniků dat v cloudu?', 'chybná konfigurace (např. veřejný bucket)', ['zemětřesení', 'chyba procesoru', 'pomalá síť']],
      ['Jak se nazývá firewall pro VM v AWS?', 'bezpečnostní skupina (security group)', ['IAM', 'S3', 'Route 53']],
      ['K čemu slouží MFA?', 'k ověření dalším faktorem kromě hesla', ['k šifrování disků', 'k zálohování', 'k vyvažování zátěže']],
    ],
    [
      {
        q: 'Jak zabezpečíš účet a prostředky ve veřejném cloudu?',
        answer:
          'Vycházím z modelu sdílené odpovědnosti – za účty, data a konfiguraci odpovídám já. Hlavní účet zabezpečím silným heslem a MFA a nepoužívám ho; pro lidi vytvořím uživatele a skupiny v IAM s principem nejmenších oprávnění, pro aplikace role místo uložených klíčů. Data šifruji v klidu i při přenosu, klíče spravuji v KMS / Key Vault. Síť omezím bezpečnostními skupinami jen na potřebné porty, servery dám do privátních podsítí a správu přes VPN. Úložiště nebude veřejné. Zapnu logování a audit, upozornění, zálohy, aktualizace a kontrolu nákladů.',
        points: [
          ['sdílená odpovědnost', ['sdílen', 'odpovědn']],
          ['MFA, chránit root účet', ['mfa', 'root', 'hlavní']],
          ['IAM, nejmenší oprávnění, role', ['iam', 'oprávn', 'rol']],
          ['šifrování', ['šifr', 'kms']],
          ['síť – bezpečnostní skupiny, privátní podsítě', ['bezpečnostn', 'skupin', 'podsít', 'vpn']],
          ['logování a audit', ['log', 'audit', 'monitor']],
        ],
      },
    ],
  ),
  topic(
    13,
    'automatizace',
    'Automatizace a infrastruktura jako kód',
    'Infrastruktura jako kód (IaC) popisuje servery, sítě a služby v textových souborech, které se verzují a automaticky aplikují. Díky tomu je nasazení opakovatelné, rychlé a bez ručních chyb. Používají se nástroje Terraform, Ansible, cloud-init a skripty v PowerShellu či Bashi, často v rámci CI/CD.',
    [
      ['Infrastruktura jako kód', ['deklarativní přístup – popíšu cílový stav (Terraform, Kubernetes YAML)', 'imperativní – posloupnost příkazů (skripty)', 'výhody: opakovatelnost, verzování v Gitu, revize změn, rychlá obnova']],
      ['Nástroje', ['Terraform / OpenTofu – vytváření infrastruktury u různých poskytovatelů (plan, apply)', 'Ansible – konfigurace serverů přes SSH bez agenta, playbooky v YAML, idempotence', 'cloud-init – nastavení VM při prvním startu', 'šablony poskytovatelů: AWS CloudFormation, Azure ARM / Bicep', 'PowerShell (Hyper-V, Azure), Bash, CLI nástroje (aws, az)']],
      ['CI/CD a DevOps', ['CI – průběžná integrace: automatické sestavení a testy', 'CD – průběžné doručování / nasazování', 'GitHub Actions, GitLab CI, Jenkins', 'monitoring a logování (Prometheus, Grafana)']],
    ],
    [
      ['IaC', 'Infrastruktura jako kód – popis infrastruktury v souborech.'],
      ['Terraform', 'Deklarativní nástroj pro vytváření infrastruktury u různých poskytovatelů.'],
      ['Ansible', 'Nástroj pro automatickou konfiguraci serverů přes SSH bez agenta.'],
      ['idempotence', 'Opakované spuštění dá stejný výsledek a nic nerozbije.'],
      ['cloud-init', 'Nástroj pro automatické nastavení VM při prvním startu.'],
      ['CI/CD', 'Průběžná integrace a nasazování – automatické sestavení, testy a nasazení.'],
    ],
    [
      ['Který nástroj konfiguruje servery přes SSH bez agenta?', 'Ansible', ['Terraform', 'Docker', 'Hyper-V']],
      ['Co znamená idempotence?', 'opakované spuštění dá stejný výsledek', ['spuštění jen jednou', 'paralelní běh', 'šifrování konfigurace']],
      ['Jaký je hlavní přínos IaC?', 'opakovatelné a verzované nasazení bez ručních chyb', ['levnější hardware', 'rychlejší procesor', 'není potřeba síť']],
      ['Kterým příkazem Terraform provede změny?', 'terraform apply', ['terraform run', 'terraform start', 'terraform deploy']],
      ['Co je CI?', 'automatické sestavení a testování při každé změně kódu', ['typ hypervizoru', 'cloudové úložiště', 'záloha databáze']],
    ],
    [
      {
        q: 'Co je infrastruktura jako kód a jaké nástroje znáš?',
        answer:
          'Infrastruktura jako kód znamená, že servery, sítě a služby nepopisuji ručním klikáním, ale v textových souborech, které jsou uložené v Gitu, procházejí revizí a automaticky se aplikují. Nasazení je pak opakovatelné, rychlé a bez ručních chyb a infrastrukturu lze snadno obnovit. Deklarativní nástroje popisují cílový stav – Terraform (plan, apply), CloudFormation, Bicep, Kubernetes YAML. Ansible konfiguruje servery přes SSH pomocí playbooků a je idempotentní. Cloud-init nastaví VM při prvním startu a skripty v PowerShellu nebo Bashi doplňují zbytek; vše se spouští v CI/CD.',
        points: [
          ['definice – infrastruktura v souborech, Git', ['soubor', 'git', 'kód']],
          ['výhody – opakovatelnost, bez chyb', ['opakovat', 'chyb', 'rychl']],
          ['Terraform', ['terraform']],
          ['Ansible, idempotence', ['ansible', 'idempot']],
          ['CI/CD, cloud-init, skripty', ['ci', 'cloud-init', 'skript', 'powershell']],
        ],
      },
    ],
  ),
];
