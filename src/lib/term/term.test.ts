import { describe, expect, it } from 'vitest';
import { CISCO_TASKS, CiscoSim, parseIf } from './cisco';
import { LINUX_TASKS, LinuxSim } from './linux';

const run = (s: { exec: (l: string) => { out: string[] } }, lines: string[]) => lines.map((l) => s.exec(l).out.join('\n')).join('\n');
const allOk = (items: { label: string; ok: boolean }[]) => items.filter((i) => !i.ok).map((i) => i.label);

describe('Cisco – úlohy podle vzorového řešení', () => {
  for (const t of CISCO_TASKS) {
    it(t.id, () => {
      const s = t.create();
      expect(allOk(t.check(s)).length).toBeGreaterThan(0);
      const out = run(s, t.solution.split('\n').map((l) => l.trim()));
      expect(out).not.toMatch(/Invalid input|Incomplete|Ambiguous/);
      expect(allOk(t.check(s))).toEqual([]);
    });
  }
});

describe('Cisco – parser', () => {
  it('názvy rozhraní', () => {
    expect(parseIf('g0/0')).toBe('GigabitEthernet0/0');
    expect(parseIf('gig0/0.10')).toBe('GigabitEthernet0/0.10');
    expect(parseIf('FastEthernet0/1')).toBe('FastEthernet0/1');
    expect(parseIf('s0/0/0')).toBe('Serial0/0/0');
    expect(parseIf('vlan99')).toBe('Vlan99');
    expect(parseIf('x0/0')).toBeNull();
  });
  it('zkratky, režimy a chyby', () => {
    const s = new CiscoSim('router');
    expect(s.prompt()).toBe('Router>');
    expect(s.exec('e').out.join()).toMatch(/Ambiguous/);
    s.exec('en');
    expect(s.prompt()).toBe('Router#');
    s.exec('conf t');
    expect(s.prompt()).toBe('Router(config)#');
    s.exec('int gig 0/0');
    expect(s.prompt()).toBe('Router(config-if)#');
    s.exec('ip add 192.168.1.1 255.255.255.0');
    s.exec('no sh');
    expect(s.exec('do sh ip int br').out.join('\n')).toMatch(/GigabitEthernet0\/0\s+192\.168\.1\.1\s+YES manual up/);
    expect(s.exec('ip address').out.join()).toMatch(/Incomplete/);
    expect(s.exec('ip adress 1.1.1.1 255.0.0.0').out.join()).toMatch(/Invalid input/);
    // globální příkaz z podrežimu přepne do config
    s.exec('hostname R9');
    expect(s.prompt()).toBe('R9(config)#');
    s.exec('int g0/1');
    expect(s.exec('ip address 192.168.1.5 255.255.255.0').out.join()).toMatch(/overlaps with GigabitEthernet0\/0/);
    expect(s.exec('ip address 10.0.0.0 255.255.255.252').out.join()).toMatch(/Bad mask/);
    s.exec('end');
    expect(s.prompt()).toBe('R9#');
    expect(s.exec('sh run').out.join('\n')).toMatch(/hostname R9[\s\S]*interface GigabitEthernet0\/0\n ip address 192\.168\.1\.1 255\.255\.255\.0/);
    expect(s.exec('ping 192.168.1.20').out.join()).toMatch(/!!!!!/);
    expect(s.exec('ping 8.8.8.8').out.join()).toMatch(/\.\.\.\.\./);
  });
  it('switch – rozsahy a VLAN, router odmítne switchport', () => {
    const s = new CiscoSim('switch');
    run(s, ['en', 'conf t', 'int range fa0/1 - 3', 'sw mo acc', 'sw acc vl 30']);
    expect(s.ifs.get('FastEthernet0/3')!.accessVlan).toBe(30);
    expect(s.vlans.has(30)).toBe(true);
    const r = new CiscoSim('router');
    expect(run(r, ['en', 'conf t', 'int g0/0', 'switchport mode access'])).toMatch(/Invalid input/);
  });
  it('subrozhraní vyžaduje encapsulation před IP', () => {
    const s = new CiscoSim('router');
    expect(run(s, ['en', 'conf t', 'int g0/0.10', 'ip address 192.168.10.1 255.255.255.0'])).toMatch(/802\.1Q/);
  });
  it('RSA bez domény a s výchozím názvem', () => {
    const s = new CiscoSim('router');
    expect(run(s, ['en', 'conf t', 'crypto key generate rsa'])).toMatch(/hostname other than Router/);
    expect(run(s, ['hostname R1', 'crypto key generate rsa'])).toMatch(/domain-name first/);
  });
});

describe('Linux – úlohy', () => {
  it('netplan', () => {
    const t = LINUX_TASKS.find((x) => x.id === 'lx-netplan')!;
    const s = t.create();
    expect(s.saveFile('/etc/netplan/01-netcfg.yaml', 'network:\n  version: 2\n  ethernets:\n    ens33:\n      dhcp4: false\n      addresses: [192.168.100.10/24]\n      routes:\n        - to: default\n          via: 192.168.100.1\n      nameservers:\n        addresses: [192.168.100.1]\n')).toBeNull();
    expect(allOk(t.check(s))).toEqual(['konfigurace je uplatněná (netplan apply)']);
    s.exec('netplan apply');
    expect(allOk(t.check(s))).toEqual([]);
    expect(s.exec('ping 192.168.100.1').out.join()).toMatch(/4 received/);
    expect(s.exec('ip -br a').out.join()).toMatch(/192\.168\.100\.10\/24/);
  });
  it('netplan s tabulátorem selže', () => {
    const s = LINUX_TASKS[0].create();
    s.saveFile('/etc/netplan/01-netcfg.yaml', 'network:\n\tethernets:\n');
    expect(s.exec('netplan apply').out.join()).toMatch(/tabs/);
  });
  it('interfaces (Debian)', () => {
    const t = LINUX_TASKS.find((x) => x.id === 'lx-interfaces')!;
    const s = t.create();
    s.saveFile('/etc/network/interfaces', 'auto lo\niface lo inet loopback\n\nauto ens33\niface ens33 inet static\n    address 192.168.100.20\n    netmask 255.255.255.0\n    gateway 192.168.100.1\n');
    s.exec('systemctl restart networking');
    expect(allOk(t.check(s))).toEqual([]);
  });
  for (const id of ['lx-hostname', 'lx-users', 'lx-web', 'lx-forward']) {
    it(id, () => {
      const t = LINUX_TASKS.find((x) => x.id === id)!;
      const s = t.create();
      const cmds = t.solution.split('\n').filter((l) => l && !/^nano|→|^\(|^\s/.test(l));
      run(s, cmds);
      if (id === 'lx-hostname') s.saveFile('/etc/hosts', '127.0.0.1\tlocalhost\n127.0.1.1\tsrv-web\n');
      if (id === 'lx-forward') {
        s.saveFile('/etc/sysctl.conf', 'net.ipv4.ip_forward=1\n');
        s.exec('sysctl -p');
      }
      expect(allOk(t.check(s))).toEqual([]);
    });
  }
  it('ssh', () => {
    const t = LINUX_TASKS.find((x) => x.id === 'lx-ssh')!;
    const s = t.create();
    s.exec('apt install openssh-server');
    s.exec('nano /etc/ssh/sshd_config');
    s.saveFile('/etc/ssh/sshd_config', (s.read('/etc/ssh/sshd_config') ?? '').replace('#PermitRootLogin prohibit-password', 'PermitRootLogin no'));
    expect(allOk(t.check(s))).toEqual(['služba ssh restartována po úpravě']);
    s.exec('sudo systemctl restart sshd');
    expect(allOk(t.check(s))).toEqual([]);
  });
  it('dhcp – chybná konfigurace služba nenaběhne, správná ano', () => {
    const t = LINUX_TASKS.find((x) => x.id === 'lx-dhcp')!;
    const s = t.create();
    s.exec('apt install isc-dhcp-server');
    expect(s.exec('systemctl restart isc-dhcp-server').out.join()).toMatch(/failed/);
    s.saveFile('/etc/default/isc-dhcp-server', 'INTERFACESv4="ens33"\n');
    s.saveFile('/etc/dhcp/dhcpd.conf', 'subnet 192.168.100.0 netmask 255.255.255.0 {\n  range 192.168.2.100 192.168.2.200;\n}\n');
    expect(s.exec('systemctl restart isc-dhcp-server').out.join()).toMatch(/failed/);
    expect(s.exec('systemctl status isc-dhcp-server').out.join('\n')).toMatch(/not on net/);
    s.saveFile('/etc/dhcp/dhcpd.conf', 'subnet 192.168.100.0 netmask 255.255.255.0 {\n  range 192.168.100.100 192.168.100.200;\n  option routers 192.168.100.1;\n  option domain-name-servers 192.168.100.10;\n}\n');
    expect(s.exec('systemctl restart isc-dhcp-server').out).toEqual([]);
    expect(allOk(t.check(s))).toEqual([]);
  });
  it('základní příkazy', () => {
    const s = new LinuxSim({ distro: 'debian' });
    expect(s.exec('cd /etc').out).toEqual([]);
    expect(s.prompt()).toBe('root@server:/etc#');
    expect(s.exec('cat hostname').out).toEqual(['server']);
    expect(s.exec('foo').out.join()).toMatch(/příkaz nenalezen/);
    s.exec('mkdir -p /data/x');
    s.exec('chmod 750 /data/x');
    expect(s.exec('ls -ld /data/x').out.join()).toMatch(/^drwxr-x---/);
    s.exec('echo "ahoj" > /tmp/a.txt');
    s.exec('echo "svete" >> /tmp/a.txt');
    expect(s.exec('cat /tmp/a.txt').out).toEqual(['ahoj', 'svete']);
    expect(s.exec('nano /etc/hosts').editor?.path).toBe('/etc/hosts');
    expect(s.exec('apt install neexistuje').out.join()).toMatch(/Nelze najít/);
  });
});
