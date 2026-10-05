import type { CommandItem, Platform } from '../../types';
import { CLOUD_COMMANDS } from '../cloud/commands';

/**
 * Příkazy pro trenažér. `accepted` = další přijatelné zápisy (zkratky).
 * U dlouhých příkazů (PowerShell) se kontroluje přítomnost povinných částí – viz `required`.
 */
export interface CommandDef extends CommandItem {
  required?: string[];
}

let n = 0;
const c = (platform: Platform, group: string, task: string, command: string, accepted: string[] = [], note?: string, required?: string[]): CommandDef => ({
  id: `cmd-${platform}-${++n}`,
  platform,
  group,
  task,
  command,
  accepted,
  note,
  required,
});

export const PLATFORM_LABEL: Record<Platform, string> = {
  cisco: 'Cisco IOS (Packet Tracer)',
  linux: 'Linux (Debian 13)',
  windows: 'Windows Server (PowerShell)',
  docker: 'Docker a kontejnery',
  hyperv: 'Hyper-V (PowerShell)',
  proxmox: 'Proxmox VE',
  virtualbox: 'VirtualBox (VBoxManage)',
};

export const COMMANDS: CommandDef[] = [
  // ===== Cisco – základy =====
  c('cisco', 'Základy', 'Přepni se do privilegovaného režimu (Router> → Router#).', 'enable', ['en']),
  c('cisco', 'Základy', 'Přejdi do globálního konfiguračního režimu.', 'configure terminal', ['conf t', 'config t', 'configure t']),
  c('cisco', 'Základy', 'Pojmenuj zařízení R1.', 'hostname R1'),
  c('cisco', 'Základy', 'Nastav šifrované heslo pro privilegovaný režim na „cisco“.', 'enable secret cisco'),
  c('cisco', 'Základy', 'Zašifruj všechna hesla uložená v konfiguraci.', 'service password-encryption'),
  c('cisco', 'Základy', 'Vstup do konfigurace rozhraní GigabitEthernet0/0.', 'interface g0/0', ['interface gigabitethernet0/0', 'interface gigabitethernet 0/0', 'int g0/0', 'int gig0/0', 'interface gig0/0', 'int gigabitethernet0/0']),
  c('cisco', 'Základy', 'Nastav na rozhraní adresu 192.168.1.1 s maskou /24.', 'ip address 192.168.1.1 255.255.255.0', ['ip add 192.168.1.1 255.255.255.0', 'ip addr 192.168.1.1 255.255.255.0']),
  c('cisco', 'Základy', 'Zapni rozhraní (na routeru je výchozí stav vypnuto).', 'no shutdown', ['no shut', 'no sh']),
  c('cisco', 'Základy', 'Ulož běžící konfiguraci, aby přežila restart.', 'copy running-config startup-config', ['copy run start', 'write', 'wr', 'write memory', 'copy run star']),
  c('cisco', 'Základy', 'Zobraz přehled rozhraní, jejich IP adres a stavu.', 'show ip interface brief', ['sh ip int br', 'sh ip int brief', 'show ip int brief', 'show ip int br']),
  c('cisco', 'Základy', 'Zobraz běžící konfiguraci.', 'show running-config', ['sh run', 'show run', 'sh running-config']),
  c('cisco', 'Základy', 'Nastav na switchi výchozí bránu 192.168.1.1 (pro správu).', 'ip default-gateway 192.168.1.1'),
  c('cisco', 'Základy', 'Nastav uvítací zprávu (banner) „Pristup jen pro opravnene“.', 'banner motd #Pristup jen pro opravnene#', [], 'Oddělovač (#) může být libovolný znak.', ['banner motd']),
  // ===== Cisco – zabezpečení =====
  c('cisco', 'Zabezpečení', 'Přejdi do konfigurace konzolové linky.', 'line console 0', ['line con 0']),
  c('cisco', 'Zabezpečení', 'Na lince nastav heslo „cisco“.', 'password cisco'),
  c('cisco', 'Zabezpečení', 'Na lince vyžaduj zadání hesla.', 'login'),
  c('cisco', 'Zabezpečení', 'Nastav doménové jméno firma.local (nutné pro SSH klíče).', 'ip domain-name firma.local', ['ip domain name firma.local']),
  c('cisco', 'Zabezpečení', 'Vygeneruj RSA klíče pro SSH.', 'crypto key generate rsa', ['crypto key generate rsa modulus 1024', 'crypto key generate rsa modulus 2048'], 'Poté zadej délku klíče, např. 1024.'),
  c('cisco', 'Zabezpečení', 'Vytvoř lokálního uživatele admin s heslem „heslo123“.', 'username admin secret heslo123', ['username admin password heslo123']),
  c('cisco', 'Zabezpečení', 'Přejdi do konfigurace virtuálních terminálů 0–4.', 'line vty 0 4'),
  c('cisco', 'Zabezpečení', 'Povol na VTY jen přístup přes SSH.', 'transport input ssh'),
  c('cisco', 'Zabezpečení', 'Ověřuj přihlášení na VTY podle lokálních uživatelů.', 'login local'),
  c('cisco', 'Zabezpečení', 'Zapni SSH verze 2.', 'ip ssh version 2'),
  c('cisco', 'Zabezpečení', 'Zapni na portu port security.', 'switchport port-security'),
  c('cisco', 'Zabezpečení', 'Povol na portu nejvýše 2 MAC adresy.', 'switchport port-security maximum 2'),
  c('cisco', 'Zabezpečení', 'Při porušení port security port vypni.', 'switchport port-security violation shutdown'),
  // ===== Cisco – VLAN =====
  c('cisco', 'VLAN', 'Vytvoř VLAN 10.', 'vlan 10'),
  c('cisco', 'VLAN', 'Pojmenuj vytvořenou VLAN „ZAMESTNANCI“.', 'name ZAMESTNANCI'),
  c('cisco', 'VLAN', 'Vyber najednou porty FastEthernet0/1 až 0/10.', 'interface range f0/1-10', ['interface range fa0/1-10', 'int range f0/1-10', 'int range fa0/1-10', 'interface range f0/1 - 10', 'int range f0/1 - 10', 'interface range fastethernet0/1-10']),
  c('cisco', 'VLAN', 'Nastav port jako přístupový (access).', 'switchport mode access', ['sw mode access', 'switchport mode acc']),
  c('cisco', 'VLAN', 'Zařaď přístupový port do VLAN 10.', 'switchport access vlan 10', ['sw access vlan 10', 'sw acc vlan 10']),
  c('cisco', 'VLAN', 'Nastav port jako trunk.', 'switchport mode trunk', ['sw mode trunk']),
  c('cisco', 'VLAN', 'Povol na trunku jen VLAN 10, 20 a 99.', 'switchport trunk allowed vlan 10,20,99', ['sw trunk allowed vlan 10,20,99']),
  c('cisco', 'VLAN', 'Nastav nativní VLAN trunku na 99.', 'switchport trunk native vlan 99', ['sw trunk native vlan 99']),
  c('cisco', 'VLAN', 'Zobraz přehled VLAN a portů v nich.', 'show vlan brief', ['sh vlan br', 'sh vlan brief', 'show vlan br']),
  c('cisco', 'VLAN', 'Zobraz trunkové porty.', 'show interfaces trunk', ['sh int trunk', 'show int trunk', 'sh interfaces trunk']),
  c('cisco', 'VLAN', 'Na routeru vytvoř podrozhraní g0/0.10 pro VLAN 10.', 'interface g0/0.10', ['int g0/0.10', 'interface gigabitethernet0/0.10', 'int gig0/0.10']),
  c('cisco', 'VLAN', 'Na podrozhraní nastav značkování pro VLAN 10 (802.1Q).', 'encapsulation dot1Q 10', ['encapsulation dot1q 10', 'encap dot1q 10']),
  c('cisco', 'VLAN', 'Na L3 switchi vytvoř rozhraní SVI pro VLAN 10.', 'interface vlan 10', ['int vlan 10', 'int vlan10', 'interface vlan10']),
  c('cisco', 'VLAN', 'Na L3 switchi zapni směrování.', 'ip routing'),
  // ===== Cisco – směrování =====
  c('cisco', 'Směrování', 'Přidej statickou trasu do sítě 192.168.2.0/24 přes 10.0.0.2.', 'ip route 192.168.2.0 255.255.255.0 10.0.0.2'),
  c('cisco', 'Směrování', 'Přidej výchozí trasu přes 10.0.0.1.', 'ip route 0.0.0.0 0.0.0.0 10.0.0.1'),
  c('cisco', 'Směrování', 'Přidej záložní (plovoucí) výchozí trasu přes 10.0.1.1 s administrativní vzdáleností 5.', 'ip route 0.0.0.0 0.0.0.0 10.0.1.1 5'),
  c('cisco', 'Směrování', 'Spusť proces OSPF číslo 1.', 'router ospf 1'),
  c('cisco', 'Směrování', 'Do OSPF oblasti 0 zahrň síť 192.168.1.0/24.', 'network 192.168.1.0 0.0.0.255 area 0'),
  c('cisco', 'Směrování', 'Vypni rozesílání OSPF zpráv na rozhraní g0/0 do LAN.', 'passive-interface g0/0', ['passive-interface gigabitethernet0/0']),
  c('cisco', 'Směrování', 'Nastav ručně OSPF router ID 1.1.1.1.', 'router-id 1.1.1.1'),
  c('cisco', 'Směrování', 'Šiř výchozí trasu ostatním routerům v OSPF.', 'default-information originate'),
  c('cisco', 'Směrování', 'Zobraz směrovací tabulku.', 'show ip route', ['sh ip route', 'sh ip ro']),
  c('cisco', 'Směrování', 'Zobraz OSPF sousedy.', 'show ip ospf neighbor', ['sh ip ospf nei', 'sh ip ospf neighbor', 'show ip ospf nei']),
  // ===== Cisco – DHCP a NAT =====
  c('cisco', 'DHCP a NAT', 'Vyluč z DHCP adresy 192.168.1.1 až 192.168.1.10.', 'ip dhcp excluded-address 192.168.1.1 192.168.1.10'),
  c('cisco', 'DHCP a NAT', 'Vytvoř DHCP pool s názvem LAN.', 'ip dhcp pool LAN'),
  c('cisco', 'DHCP a NAT', 'V poolu nastav síť 192.168.1.0/24.', 'network 192.168.1.0 255.255.255.0'),
  c('cisco', 'DHCP a NAT', 'V poolu nastav výchozí bránu 192.168.1.1.', 'default-router 192.168.1.1'),
  c('cisco', 'DHCP a NAT', 'V poolu nastav DNS server 192.168.1.5.', 'dns-server 192.168.1.5'),
  c('cisco', 'DHCP a NAT', 'Na rozhraní routeru přeposílej DHCP požadavky na server 10.0.0.5.', 'ip helper-address 10.0.0.5'),
  c('cisco', 'DHCP a NAT', 'Zobraz přidělené DHCP adresy.', 'show ip dhcp binding', ['sh ip dhcp binding', 'sh ip dhcp bin']),
  c('cisco', 'DHCP a NAT', 'Označ rozhraní do LAN jako vnitřní pro NAT.', 'ip nat inside'),
  c('cisco', 'DHCP a NAT', 'Označ rozhraní do internetu jako vnější pro NAT.', 'ip nat outside'),
  c('cisco', 'DHCP a NAT', 'Vytvoř ACL 1, která povolí síť 192.168.1.0/24.', 'access-list 1 permit 192.168.1.0 0.0.0.255'),
  c('cisco', 'DHCP a NAT', 'Zapni PAT – překlad sítě z ACL 1 na adresu rozhraní g0/1.', 'ip nat inside source list 1 interface g0/1 overload', ['ip nat inside source list 1 interface gigabitethernet0/1 overload', 'ip nat inside source list 1 int g0/1 overload']),
  c('cisco', 'DHCP a NAT', 'Zobraz aktuální překlady NAT.', 'show ip nat translations', ['sh ip nat trans', 'sh ip nat translations', 'show ip nat trans']),
  // ===== Cisco – IPv6 =====
  c('cisco', 'IPv6', 'Zapni na routeru směrování IPv6.', 'ipv6 unicast-routing'),
  c('cisco', 'IPv6', 'Nastav na rozhraní adresu 2001:db8:1::1/64.', 'ipv6 address 2001:db8:1::1/64'),
  c('cisco', 'IPv6', 'Nastav na rozhraní link-local adresu fe80::1.', 'ipv6 address fe80::1 link-local'),
  c('cisco', 'IPv6', 'Zobraz IPv6 adresy rozhraní.', 'show ipv6 interface brief', ['sh ipv6 int br', 'sh ipv6 int brief', 'show ipv6 int brief']),

  // ===== Linux =====
  c('linux', 'Síť', 'Zobraz IP adresy všech rozhraní.', 'ip a', ['ip addr', 'ip address', 'ip addr show', 'ip a s', 'ip address show']),
  c('linux', 'Síť', 'Přidej na rozhraní enp0s3 adresu 192.168.10.10/24.', 'ip addr add 192.168.10.10/24 dev enp0s3', ['ip a add 192.168.10.10/24 dev enp0s3', 'ip address add 192.168.10.10/24 dev enp0s3']),
  c('linux', 'Síť', 'Zapni rozhraní enp0s3.', 'ip link set enp0s3 up', ['ip link set dev enp0s3 up']),
  c('linux', 'Síť', 'Nastav výchozí bránu 192.168.10.1.', 'ip route add default via 192.168.10.1', ['ip r add default via 192.168.10.1', 'ip route add 0.0.0.0/0 via 192.168.10.1']),
  c('linux', 'Síť', 'Zobraz směrovací tabulku.', 'ip route', ['ip r', 'ip route show', 'route -n']),
  c('linux', 'Síť', 'Uplatni změny v /etc/network/interfaces (restart sítě v Debianu).', 'systemctl restart networking', ['service networking restart']),
  c('linux', 'Síť', 'Restartuj síťování na Debianu (/etc/network/interfaces).', 'systemctl restart networking'),
  c('linux', 'Síť', 'Nastav název počítače na server1.', 'hostnamectl set-hostname server1'),
  c('linux', 'Síť', 'Zapni (dočasně) přeposílání IPv4 paketů – Linux jako router.', 'sysctl -w net.ipv4.ip_forward=1', ['echo 1 > /proc/sys/net/ipv4/ip_forward'], 'Trvale: řádek net.ipv4.ip_forward=1 v /etc/sysctl.conf a příkaz sysctl -p.'),
  c('linux', 'Síť', 'Zapni NAT (maškarádu) pro provoz odcházející rozhraním enp0s3.', 'iptables -t nat -A POSTROUTING -o enp0s3 -j MASQUERADE'),
  c('linux', 'Síť', 'Otestuj překlad jména www.firma.local.', 'nslookup www.firma.local', ['dig www.firma.local', 'host www.firma.local']),
  c('linux', 'Balíčky a služby', 'Aktualizuj seznam balíčků.', 'apt update', ['apt-get update']),
  c('linux', 'Balíčky a služby', 'Nainstaluj DHCP server (ISC).', 'apt install isc-dhcp-server', ['apt-get install isc-dhcp-server', 'apt install -y isc-dhcp-server', 'apt-get install -y isc-dhcp-server']),
  c('linux', 'Balíčky a služby', 'Nainstaluj DNS server BIND.', 'apt install bind9', ['apt-get install bind9', 'apt install -y bind9', 'apt install bind9 bind9utils']),
  c('linux', 'Balíčky a služby', 'Nainstaluj webový server Apache.', 'apt install apache2', ['apt-get install apache2', 'apt install -y apache2']),
  c('linux', 'Balíčky a služby', 'Nainstaluj SSH server.', 'apt install openssh-server', ['apt-get install openssh-server', 'apt install -y openssh-server']),
  c('linux', 'Balíčky a služby', 'Restartuj službu DHCP serveru.', 'systemctl restart isc-dhcp-server'),
  c('linux', 'Balíčky a služby', 'Nastav, aby se DNS server (bind9) spouštěl po startu.', 'systemctl enable bind9', ['systemctl enable named']),
  c('linux', 'Balíčky a služby', 'Zobraz stav služby apache2.', 'systemctl status apache2'),
  c('linux', 'Balíčky a služby', 'Zkontroluj syntaxi konfigurace BIND.', 'named-checkconf'),
  c('linux', 'Balíčky a služby', 'Zkontroluj zónu firma.local v souboru /etc/bind/db.firma.local.', 'named-checkzone firma.local /etc/bind/db.firma.local'),
  c('linux', 'Balíčky a služby', 'Napiš cestu k hlavnímu konfiguračnímu souboru ISC DHCP serveru.', '/etc/dhcp/dhcpd.conf'),
  c('linux', 'Balíčky a služby', 'Napiš cestu k souboru, kde se určuje rozhraní, na kterém DHCP server poslouchá.', '/etc/default/isc-dhcp-server'),
  c('linux', 'Balíčky a služby', 'Povol ve firewallu ufw SSH.', 'ufw allow 22/tcp', ['ufw allow ssh', 'ufw allow 22']),
  c('linux', 'Uživatelé a oprávnění', 'Vytvoř uživatele jan (s domovským adresářem).', 'adduser jan', ['useradd -m jan', 'useradd -m -s /bin/bash jan']),
  c('linux', 'Uživatelé a oprávnění', 'Nastav uživateli jan heslo.', 'passwd jan'),
  c('linux', 'Uživatelé a oprávnění', 'Přidej uživatele jan do skupiny sudo.', 'usermod -aG sudo jan', ['usermod -a -G sudo jan', 'adduser jan sudo', 'gpasswd -a jan sudo']),
  c('linux', 'Uživatelé a oprávnění', 'Vytvoř skupinu ucetni.', 'groupadd ucetni', ['addgroup ucetni']),
  c('linux', 'Uživatelé a oprávnění', 'Nastav souboru skript.sh oprávnění rwxr-xr-x.', 'chmod 755 skript.sh', ['chmod u=rwx,go=rx skript.sh']),
  c('linux', 'Uživatelé a oprávnění', 'Změň vlastníka i skupinu adresáře /data na jan:ucetni.', 'chown jan:ucetni /data'),
  c('linux', 'Uživatelé a oprávnění', 'Změň vlastníka adresáře /data rekurzivně (i s obsahem) na jan.', 'chown -R jan /data'),

  // ===== Windows Server =====
  c('windows', 'Síť a počítač', 'Zobraz úplnou konfiguraci IP (příkazový řádek).', 'ipconfig /all'),
  c('windows', 'Síť a počítač', 'Nastav statickou adresu 192.168.10.5/24 s bránou 192.168.10.1 na rozhraní „Ethernet“.', 'New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 192.168.10.5 -PrefixLength 24 -DefaultGateway 192.168.10.1', [], undefined, ['new-netipaddress', '-interfacealias ethernet', '-ipaddress 192.168.10.5', '-prefixlength 24', '-defaultgateway 192.168.10.1']),
  c('windows', 'Síť a počítač', 'Nastav rozhraní „Ethernet“ DNS server 192.168.10.5.', 'Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses 192.168.10.5', [], undefined, ['set-dnsclientserveraddress', '-interfacealias ethernet', '-serveraddresses 192.168.10.5']),
  c('windows', 'Síť a počítač', 'Přejmenuj počítač na DC1 a restartuj ho.', 'Rename-Computer -NewName DC1 -Restart', [], undefined, ['rename-computer', 'dc1', '-restart']),
  c('windows', 'Síť a počítač', 'Zobraz nainstalované role a funkce.', 'Get-WindowsFeature'),
  c('windows', 'Síť a počítač', 'Otestuj překlad jména firma.local.', 'nslookup firma.local', ['resolve-dnsname firma.local']),
  c('windows', 'Active Directory', 'Nainstaluj roli Active Directory Domain Services i s nástroji pro správu.', 'Install-WindowsFeature AD-Domain-Services -IncludeManagementTools', [], undefined, ['install-windowsfeature', 'ad-domain-services', '-includemanagementtools']),
  c('windows', 'Active Directory', 'Vytvoř novou doménovou strukturu (doménu) firma.local – server se stane řadičem domény.', 'Install-ADDSForest -DomainName firma.local', [], 'Příkaz se zeptá na heslo pro režim obnovení (DSRM) a restartuje server.', ['install-addsforest', '-domainname firma.local']),
  c('windows', 'Active Directory', 'Vytvoř organizační jednotku Ucetni.', 'New-ADOrganizationalUnit -Name Ucetni', [], undefined, ['new-adorganizationalunit', '-name ucetni']),
  c('windows', 'Active Directory', 'Vytvoř uživatele jnovak (jméno Jan Novák), zadej heslo a účet povol.', 'New-ADUser -Name "Jan Novak" -SamAccountName jnovak -AccountPassword (Read-Host -AsSecureString) -Enabled $true', [], undefined, ['new-aduser', '-samaccountname jnovak', '-accountpassword', '-enabled $true']),
  c('windows', 'Active Directory', 'Vytvoř globální skupinu Ucetni.', 'New-ADGroup -Name Ucetni -GroupScope Global', [], undefined, ['new-adgroup', '-name ucetni', '-groupscope global']),
  c('windows', 'Active Directory', 'Přidej uživatele jnovak do skupiny Ucetni.', 'Add-ADGroupMember -Identity Ucetni -Members jnovak', [], undefined, ['add-adgroupmember', 'ucetni', '-members jnovak']),
  c('windows', 'Active Directory', 'Na klientovi připoj počítač do domény firma.local a restartuj ho.', 'Add-Computer -DomainName firma.local -Restart', [], undefined, ['add-computer', '-domainname firma.local', '-restart']),
  c('windows', 'Active Directory', 'Na klientovi okamžitě aplikuj zásady skupiny.', 'gpupdate /force'),
  c('windows', 'Active Directory', 'Zobraz, které zásady skupiny se na počítač uplatnily.', 'gpresult /r'),
  c('windows', 'DNS a DHCP', 'Přidej do zóny firma.local záznam A „www“ s adresou 192.168.10.10.', 'Add-DnsServerResourceRecordA -Name www -ZoneName firma.local -IPv4Address 192.168.10.10', [], undefined, ['add-dnsserverresourcerecorda', '-name www', '-zonename firma.local', '-ipv4address 192.168.10.10']),
  c('windows', 'DNS a DHCP', 'Nainstaluj roli DHCP server i s nástroji.', 'Install-WindowsFeature DHCP -IncludeManagementTools', [], undefined, ['install-windowsfeature', 'dhcp', '-includemanagementtools']),
  c('windows', 'DNS a DHCP', 'Autorizuj DHCP server v Active Directory.', 'Add-DhcpServerInDC', [], 'Bez autorizace DHCP server v doméně adresy nepřiděluje.', ['add-dhcpserverindc']),
  c('windows', 'DNS a DHCP', 'Vytvoř rozsah DHCP „LAN“ 192.168.10.100–192.168.10.200 s maskou /24.', 'Add-DhcpServerv4Scope -Name LAN -StartRange 192.168.10.100 -EndRange 192.168.10.200 -SubnetMask 255.255.255.0', [], undefined, ['add-dhcpserverv4scope', '-startrange 192.168.10.100', '-endrange 192.168.10.200', '-subnetmask 255.255.255.0']),
  c('windows', 'DNS a DHCP', 'Nastav v DHCP volby: bránu 192.168.10.1 a DNS server 192.168.10.5.', 'Set-DhcpServerv4OptionValue -Router 192.168.10.1 -DnsServer 192.168.10.5', [], undefined, ['set-dhcpserverv4optionvalue', '-router 192.168.10.1', '-dnsserver 192.168.10.5']),
  c('windows', 'Sdílení', 'Sdílej složku C:\\Data jako „Data“ s plným přístupem pro skupinu FIRMA\\Ucetni.', 'New-SmbShare -Name Data -Path C:\\Data -FullAccess FIRMA\\Ucetni', [], undefined, ['new-smbshare', '-name data', '-path c:\\data', '-fullaccess']),
  c('windows', 'Sdílení', 'Zobraz sdílené složky na serveru.', 'Get-SmbShare', ['net share']),
];

/** Příkazy všech předmětů (sítě + cloud) */
export const ALL_COMMANDS: CommandDef[] = [...COMMANDS, ...CLOUD_COMMANDS];

export const COMMAND_GROUPS = (platform: Platform) => [...new Set(ALL_COMMANDS.filter((x) => x.platform === platform).map((x) => x.group))];
