import type { ScenarioTask } from './netgen';
import { pick } from './random';

const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

export type Hypervisor = 'virtualbox' | 'hyperv' | 'proxmox';

export const HYPERVISOR_LABEL: Record<Hypervisor, string> = { virtualbox: 'VirtualBox', hyperv: 'Hyper-V', proxmox: 'Proxmox VE' };

export interface CloudScenario {
  hypervisor: Hypervisor;
  company: string;
  net: string;
  gateway: string;
  srvIp: string;
  dockerIp: string;
  webPort: number;
  ram: number;
  cores: number;
  disk: number;
  tasks: ScenarioTask[];
}

const COMPANIES = ['Obaly', 'Tiskarna', 'Papirna', 'Logistika', 'Pekarna', 'Autodily'];

/** Zadání nanečisto k praktické zkoušce z cloudu – virtualizace, kontejnery, zálohy */
export function generateCloudScenario(hv?: Hypervisor): CloudScenario {
  const hypervisor = hv ?? pick<Hypervisor>(['virtualbox', 'hyperv', 'proxmox']);
  const company = pick(COMPANIES);
  const c = rnd(10, 250);
  const net = `192.168.${c}.0/24`;
  const gateway = `192.168.${c}.1`;
  const srvIp = `192.168.${c}.${rnd(10, 40)}`;
  const dockerIp = `192.168.${c}.${rnd(50, 90)}`;
  const webPort = pick([8080, 8081, 8088, 9000]);
  const ram = pick([2, 4, 6]);
  const cores = pick([2, 4]);
  const disk = pick([40, 60, 80]);
  const name = company.toLowerCase();
  const hvName = HYPERVISOR_LABEL[hypervisor];

  const vbTasks: ScenarioTask[] = [
    {
      id: 'vb-net',
      title: 'Virtuální sítě ve VirtualBoxu',
      detail: `Server bude mít dvě síťové karty: první „Síť NAT“ s názvem ${company}-NAT (síť ${net}, přístup ven), druhou „Vnitřní síť“ backend jen pro komunikaci mezi VM.`,
      solution: `Soubor → Nástroje → Správce sítí → Sítě NAT → Vytvořit: ${company}-NAT, ${net}, DHCP podle potřeby\nVBoxManage natnetwork add --netname ${company}-NAT --network "${net}" --enable\nVnitřní síť se nevytváří zvlášť – vznikne zadáním názvu (backend) u síťové karty.\nRežimy: NAT (jen ven), Síť NAT (VM spolu + ven), Síťový most (VM v reálné síti), Vnitřní síť (jen VM), Jen hostitel (VM + hostitel).`,
    },
    {
      id: 'vb-vm',
      title: 'Virtuální server SRV1',
      detail: `Vytvoř VM srv1: ${ram} GB RAM, ${cores} CPU, dynamicky alokovaný disk VDI ${disk} GB, karta 1 v síti ${company}-NAT, karta 2 ve vnitřní síti backend.`,
      solution: `VBoxManage createvm --name srv1 --ostype Ubuntu_64 --register\nVBoxManage modifyvm srv1 --memory ${ram * 1024} --cpus ${cores} --nic1 natnetwork --nat-network1 ${company}-NAT --nic2 intnet --intnet2 backend\nVBoxManage createmedium disk --filename srv1.vdi --size ${disk * 1024} --variant Standard\nVBoxManage storagectl srv1 --name SATA --add sata\nVBoxManage storageattach srv1 --storagectl SATA --port 0 --device 0 --type hdd --medium srv1.vdi\nVBoxManage storageattach srv1 --storagectl SATA --port 1 --device 0 --type dvddrive --medium server.iso\n(GUI: Nový → paměť, CPU, disk dynamicky alokovaný; Nastavení → Síť → Karta 1 a 2)`,
    },
    {
      id: 'vb-os',
      title: 'Instalace a přídavky pro hosta',
      detail: `Nainstaluj do VM systém, nastav adresu ${srvIp}/24 s bránou ${gateway} a doinstaluj přídavky pro hosta (Guest Additions).`,
      solution: `VBoxManage startvm srv1\nPo instalaci: Zařízení → Vložit obraz CD s přídavky pro hosta\n  Windows: spustit VBoxWindowsAdditions.exe\n  Linux: apt install build-essential linux-headers-$(uname -r) → sudo sh /media/cdrom/VBoxLinuxAdditions.run\nAdresa ${srvIp}/24, brána ${gateway} (brána sítě NAT ve VirtualBoxu je .1)`,
    },
    {
      id: 'vb-snapshot',
      title: 'Snímek',
      detail: 'Před instalací služeb vytvoř snímek „cista-instalace“, proveď změnu a vrať se do něj.',
      solution: 'VBoxManage snapshot srv1 take cista-instalace\nVBoxManage controlvm srv1 poweroff\nVBoxManage snapshot srv1 restore cista-instalace\n(GUI: Snímky → Pořídit / Obnovit)',
    },
    {
      id: 'vb-export',
      title: 'Záloha / export',
      detail: 'Vyexportuj srv1 do souboru OVA a vysvětli, proč snímek není záloha.',
      solution: 'VBoxManage export srv1 --output srv1.ova\nObnova: VBoxManage import srv1.ova\nSnímek je uložený u VM a závisí na původním disku – při ztrátě disku se ztratí i snímek.',
    },
  ];

  const tasks: ScenarioTask[] =
    hypervisor === 'virtualbox'
      ? vbTasks
      : hypervisor === 'hyperv'
      ? [
          {
            id: 'hv-role',
            title: 'Příprava hostitele',
            detail: 'Na fyzickém serveru s Windows Serverem zprovozni roli Hyper-V a ověř, že procesor podporuje virtualizaci.',
            solution: 'Install-WindowsFeature -Name Hyper-V -IncludeManagementTools -Restart\nGet-ComputerInfo -Property "HyperV*"   (nebo systeminfo)',
          },
          {
            id: 'hv-switch',
            title: 'Virtuální sítě',
            detail: `Vytvoř externí přepínač „LAN-${company}“ pro síť ${net} a privátní přepínač „Backend“ pouze pro komunikaci mezi VM.`,
            solution: `New-VMSwitch -Name LAN-${company} -NetAdapterName Ethernet -AllowManagementOS $true\nNew-VMSwitch -Name Backend -SwitchType Private`,
          },
          {
            id: 'hv-vm',
            title: 'Virtuální server SRV1',
            detail: `Vytvoř VM SRV1 2. generace: ${ram} GB RAM (dynamická paměť), ${cores} vCPU, nový disk ${disk} GB (dynamický VHDX), připojená k LAN-${company}, start z ISO.`,
            solution: `New-VM -Name SRV1 -Generation 2 -MemoryStartupBytes ${ram}GB -NewVHDPath C:\\VM\\SRV1.vhdx -NewVHDSizeBytes ${disk}GB -SwitchName LAN-${company}\nSet-VMProcessor -VMName SRV1 -Count ${cores}\nSet-VMMemory -VMName SRV1 -DynamicMemoryEnabled $true\nAdd-VMDvdDrive -VMName SRV1 -Path C:\\ISO\\server.iso\nSet-VMFirmware -VMName SRV1 -FirstBootDevice (Get-VMDvdDrive -VMName SRV1)\nStart-VM -Name SRV1`,
          },
          {
            id: 'hv-os',
            title: 'Instalace a síť hosta',
            detail: `Nainstaluj do SRV1 operační systém, nastav adresu ${srvIp}/24, bránu ${gateway} a druhou síťovku v přepínači Backend.`,
            solution: `Add-VMNetworkAdapter -VMName SRV1 -SwitchName Backend\n(v SRV1) New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress ${srvIp} -PrefixLength 24 -DefaultGateway ${gateway}`,
          },
          {
            id: 'hv-checkpoint',
            title: 'Kontrolní bod',
            detail: 'Před instalací služeb vytvoř kontrolní bod „Cista-instalace“, proveď změnu a vyzkoušej návrat.',
            solution: 'Checkpoint-VM -Name SRV1 -SnapshotName Cista-instalace\nRestore-VMSnapshot -VMName SRV1 -Name Cista-instalace',
          },
          {
            id: 'hv-export',
            title: 'Záloha / export',
            detail: 'Exportuj SRV1 na záložní disk D:\\Export a vysvětli, proč kontrolní bod není záloha.',
            solution: 'Export-VM -Name SRV1 -Path D:\\Export\nKontrolní bod leží na stejném úložišti a závisí na původním disku – při ztrátě disku se ztratí i on.',
          },
        ]
      : [
          {
            id: 'px-install',
            title: 'Příprava hostitele',
            detail: `Nainstaluj Proxmox VE, nastav mu adresu v síti ${net} a přihlas se do webového rozhraní.`,
            solution: `Instalace z ISO, adresa např. 192.168.${c}.5/24, brána ${gateway}\nWeb: https://192.168.${c}.5:8006 (uživatel root, realm PAM)`,
          },
          {
            id: 'px-net',
            title: 'Virtuální sítě',
            detail: 'Ověř most vmbr0 napojený na fyzickou síťovku a vytvoř druhý most vmbr1 bez fyzického portu pro interní komunikaci VM.',
            solution: '# /etc/network/interfaces\nauto vmbr1\niface vmbr1 inet manual\n    bridge-ports none\n    bridge-stp off\n    bridge-fd 0\nifreload -a   (nebo GUI: uzel → System → Network → Create → Linux Bridge)',
          },
          {
            id: 'px-vm',
            title: 'Virtuální server SRV1',
            detail: `Vytvoř VM 101 „srv1“: ${ram} GB RAM, ${cores} jádra, disk ${disk} GB (virtio/SCSI), síť virtio na vmbr0, ISO s instalací.`,
            solution: `qm create 101 --name srv1 --memory ${ram * 1024} --cores ${cores} --net0 virtio,bridge=vmbr0 --scsihw virtio-scsi-pci --scsi0 local-lvm:${disk} --cdrom local:iso/server.iso\nqm start 101`,
          },
          {
            id: 'px-os',
            title: 'Instalace a síť hosta',
            detail: `Nainstaluj do VM systém, nastav adresu ${srvIp}/24, bránu ${gateway}, přidej druhou síťovku na vmbr1 a nainstaluj qemu-guest-agent.`,
            solution: `qm set 101 --net1 virtio,bridge=vmbr1\nqm set 101 --agent enabled=1\n(v VM) apt install qemu-guest-agent\n(v VM) adresa ${srvIp}/24, brána ${gateway}`,
          },
          {
            id: 'px-snapshot',
            title: 'Snapshot',
            detail: 'Vytvoř snapshot „cista-instalace“, proveď změnu a vrať se do něj.',
            solution: 'qm snapshot 101 cista-instalace\nqm rollback 101 cista-instalace',
          },
          {
            id: 'px-backup',
            title: 'Záloha a obnova',
            detail: 'Zazálohuj VM 101 bez jejího vypnutí a vysvětli, proč snapshot není záloha.',
            solution: 'vzdump 101 --storage local --mode snapshot --compress zstd\nObnova: qmrestore /var/lib/vz/dump/vzdump-qemu-101-….vma.zst 102\nSnapshot leží na stejném úložišti a závisí na původním disku.',
          },
        ];

  tasks.push(
    {
      id: 'dk-host',
      title: 'Docker host',
      detail: `Vytvoř druhou VM s Linuxem (adresa ${dockerIp}/24) a nainstaluj do ní Docker.`,
      solution: 'apt update\napt install docker.io docker-compose-v2   (Ubuntu; jinde podle návodu docs.docker.com)\nsystemctl enable --now docker\ndocker run hello-world',
    },
    {
      id: 'dk-web',
      title: 'Webový kontejner',
      detail: `Spusť kontejner „web-${name}“ z image nginx tak, aby byl web dostupný na http://${dockerIp}:${webPort} a obsah byl ve složce /srv/web na hostiteli.`,
      solution: `mkdir -p /srv/web && echo "<h1>${company}</h1>" > /srv/web/index.html\ndocker run -d --name web-${name} -p ${webPort}:80 -v /srv/web:/usr/share/nginx/html --restart unless-stopped nginx\ndocker ps\ncurl http://localhost:${webPort}`,
    },
    {
      id: 'dk-compose',
      title: 'Aplikace s databází (Compose)',
      detail: 'Pomocí Docker Compose spusť WordPress s databází MySQL; data databáze ukládej do pojmenovaného svazku.',
      solution:
        'services:\n  db:\n    image: mysql:8\n    environment:\n      MYSQL_ROOT_PASSWORD: heslo\n      MYSQL_DATABASE: wp\n    volumes:\n      - dbdata:/var/lib/mysql\n  wp:\n    image: wordpress\n    ports:\n      - "80:80"\n    environment:\n      WORDPRESS_DB_HOST: db\n      WORDPRESS_DB_USER: root\n      WORDPRESS_DB_PASSWORD: heslo\n      WORDPRESS_DB_NAME: wp\n    depends_on:\n      - db\nvolumes:\n  dbdata:\n\ndocker compose up -d\ndocker compose ps',
    },
    {
      id: 'dok',
      title: 'Dokumentace a ověření',
      detail: `Zdokumentuj adresy, přihlašovací údaje a konfiguraci a předveď, že web (port ${webPort}) i WordPress fungují z jiného počítače v síti.`,
      solution: `Tabulka: hostitel ${hvName}, SRV1 ${srvIp}, Docker ${dockerIp}, brána ${gateway}\nOvěření: ping, curl http://${dockerIp}:${webPort}, prohlížeč http://${dockerIp}`,
    },
  );

  return { hypervisor, company, net, gateway, srvIp, dockerIp, webPort, ram, cores, disk, tasks };
}
