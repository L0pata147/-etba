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
  it('druhá síťovka ve vnitřní síti', () => {
    const t = LINUX_TASKS.find((x) => x.id === 'lx-intnet')!;
    const s = t.create();
    expect(s.exec('cat /etc/network/interfaces').out.join('\n')).toMatch(/iface enp0s3 inet dhcp/);
    s.saveFile('/etc/network/interfaces', (s.read('/etc/network/interfaces') ?? '') + '\nauto enp0s8\niface enp0s8 inet static\n    address 192.168.100.1/24\n');
    expect(allOk(t.check(s))).toEqual(['enp0s8 je zapnuté s adresou 192.168.100.1/24']);
    s.exec('ifup enp0s8');
    expect(allOk(t.check(s))).toEqual([]);
    expect(s.ifaces[0].addr).toBe('10.0.2.15/24');
    expect(s.exec('ping 192.168.100.20').out.join()).toMatch(/4 received/);
    expect(s.exec('netplan apply').out.join()).toMatch(/nenalezen/);
    expect(s.exec('ifconfig').out.join()).toMatch(/net-tools/);
    expect(s.exec('hostnamectl').out.join()).toMatch(/Debian GNU\/Linux 13/);
  });
  it('interfaces (Debian)', () => {
    const t = LINUX_TASKS.find((x) => x.id === 'lx-interfaces')!;
    const s = t.create();
    s.saveFile('/etc/network/interfaces', 'auto lo\niface lo inet loopback\n\nauto enp0s3\niface enp0s3 inet static\n    address 192.168.100.20\n    netmask 255.255.255.0\n    gateway 192.168.100.1\n');
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
    s.saveFile('/etc/default/isc-dhcp-server', 'INTERFACESv4="enp0s3"\n');
    s.saveFile('/etc/dhcp/dhcpd.conf', 'subnet 192.168.100.0 netmask 255.255.255.0 {\n  range 192.168.2.100 192.168.2.200;\n}\n');
    expect(s.exec('systemctl restart isc-dhcp-server').out.join()).toMatch(/failed/);
    expect(s.exec('systemctl status isc-dhcp-server').out.join('\n')).toMatch(/not on net/);
    s.saveFile('/etc/dhcp/dhcpd.conf', 'subnet 192.168.100.0 netmask 255.255.255.0 {\n  range 192.168.100.100 192.168.100.200;\n  option routers 192.168.100.1;\n  option domain-name-servers 192.168.100.10;\n}\n');
    expect(s.exec('systemctl restart isc-dhcp-server').out).toEqual([]);
    expect(allOk(t.check(s))).toEqual([]);
  });
  it('základní příkazy', () => {
    const s = new LinuxSim({});
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

describe('Linux – NFS a GlusterFS', () => {
  const task = (id: string) => LINUX_TASKS.find((x) => x.id === id)!;

  it('NFS server: bez exportfs -a se nic nesdílí, mezera před závorkou varuje', () => {
    const t = task('lx-nfs-server');
    const s = t.create();
    expect(s.exec('exportfs -v').out.join()).toMatch(/příkaz nenalezen/);
    s.exec('apt install nfs-kernel-server -y');
    expect(s.read('/etc/exports')).toMatch(/access control list/);
    s.saveFile('/etc/exports', (s.read('/etc/exports') ?? '') + '/mnt/sdileni 192.168.123.0/24(rw,sync,no_subtree_check)\n');
    expect(s.exec('exportfs -a').out.join()).toMatch(/Failed to stat \/mnt\/sdileni/);
    s.exec('mkdir -p /mnt/sdileni');
    expect(allOk(t.check(s))).toEqual(['sdílení je načtené (exportfs -a) pro síť /24 s rw']);
    expect(s.exec('exportfs -a').out).toEqual([]);
    expect(s.exec('exportfs -v').out.join()).toMatch(/^\/mnt\/sdileni\s+192\.168\.123\.0\/24\(sync,wdelay,hide,no_subtree_check,sec=sys,rw,secure,root_squash,no_all_squash\)/);
    expect(allOk(t.check(s))).toEqual([]);
    s.saveFile('/etc/exports', '/mnt/sdileni 192.168.123.0/24 (rw,sync)\n');
    expect(s.exec('exportfs -ra').out.join('\n')).toMatch(/No options for \/mnt\/sdileni 192\.168\.123\.0\/24[\s\S]*No host name given/);
  });

  it('NFS klient: chybějící nfs-common, přípojný bod a daemon-reload', () => {
    const t = task('lx-nfs-klient');
    const s = t.create();
    const line = '10.0.3.251:/data /mnt/nfs nfs defaults,_netdev,x-systemd.automount 0 0\n';
    s.saveFile('/etc/fstab', (s.read('/etc/fstab') ?? '') + line);
    let out = s.exec('mount -a').out.join('\n');
    expect(out).toMatch(/systemctl daemon-reload/);
    expect(out).toMatch(/mount point does not exist/);
    s.exec('mkdir -p /mnt/nfs');
    expect(s.exec('mount -a').out.join('\n')).toMatch(/bad option[\s\S]*helper program/);
    s.exec('apt install nfs-common -y');
    s.exec('systemctl daemon-reload');
    out = s.exec('mount -a').out.join('\n');
    expect(out).toBe('');
    expect(s.exec('findmnt /mnt/nfs').out.join('\n')).toMatch(/\/mnt\/nfs\s+10\.0\.3\.251:\/data\s+nfs4/);
    expect(allOk(t.check(s))).toEqual([]);
    expect(s.exec('mount -t nfs 10.0.3.251:/zaloha /mnt').out.join()).toMatch(/access denied by server/);
  });

  it('GlusterFS: hosts, glusterd, peer probe, replica a force', () => {
    const t = task('lx-gluster');
    const s = t.create();
    s.exec('apt install glusterfs-server -y');
    expect(s.exec('gluster peer status').out.join()).toMatch(/gluster daemon is operational/);
    s.exec('systemctl enable --now glusterd');
    expect(s.exec('gluster peer probe gfs2').out.join()).toMatch(/Transport endpoint is not connected/);
    expect(s.exec('gluster peer probe gfs1').out.join()).toMatch(/localhost not needed/);
    s.saveFile('/etc/hosts', (s.read('/etc/hosts') ?? '') + '10.0.3.201  gfs1\n10.0.3.202  gfs2\n10.0.3.203  gfs3\n');
    expect(s.exec('gluster peer probe gfs2').out).toEqual(['peer probe: success']);
    expect(s.exec('gluster volume create vg0 replica 3 transport tcp gfs1:/srv/brick1 gfs2:/srv/brick2 gfs3:/srv/brick3 force').out.join()).toMatch(/Host gfs3 is not in 'Peer in Cluster' state/);
    s.exec('gluster peer probe gfs3');
    expect(s.exec('gluster peer status').out.join('\n')).toMatch(/Number of Peers: 2[\s\S]*Hostname: gfs3/);
    expect(s.exec('gluster volume create vg0 replica 3 transport tcp gfs1:/srv/brick1 gfs2:/srv/brick2 force').out.join()).toMatch(/not a multiple of replica count/);
    expect(s.exec('gluster volume create vg0 replica 3 transport tcp gfs1:/srv/brick1 gfs2:/srv/brick2 gfs3:/srv/brick3').out.join()).toMatch(/root partition[\s\S]*force/);
    expect(s.exec('gluster volume create vg0 replica 3 transport tcp gfs1:/srv/brick1 gfs2:/srv/brick2 gfs3:/srv/brick3 force').out.join()).toMatch(/success: please start/);
    expect(s.files.get('/srv/brick1')?.dir).toBe(true);
    expect(s.exec('gluster volume status vg0').out.join()).toMatch(/not started/);
    s.exec('gluster volume start vg0');
    expect(s.exec('gluster volume info').out.join('\n')).toMatch(/Type: Replicate[\s\S]*Status: Started[\s\S]*Number of Bricks: 1 x 3 = 3[\s\S]*Brick3: gfs3:\/srv\/brick3/);
    expect(s.exec('gluster volume heal vg0 info').out.join('\n')).toMatch(/Number of entries: 0/);
    expect(s.exec('gluster peer detach gfs2').out.join()).toMatch(/hosts one or more bricks/);
    expect(allOk(t.check(s))).toEqual([]);
  });

  it('GlusterFS klient', () => {
    const t = task('lx-gluster-klient');
    const s = t.create();
    s.exec('mkdir -p /mnt/gluster');
    expect(s.exec('mount -t glusterfs gfs1:/vg0 /mnt/gluster').out.join()).toMatch(/unknown filesystem type 'glusterfs'/);
    s.exec('apt install glusterfs-client -y');
    expect(s.exec('mount -t glusterfs gfs1:/vg0 /mnt/gluster').out.join()).toMatch(/Mount failed/);
    s.saveFile('/etc/hosts', (s.read('/etc/hosts') ?? '') + '10.0.3.201  gfs1\n10.0.3.202  gfs2\n10.0.3.203  gfs3\n');
    expect(s.exec('mount -t glusterfs gfs1:/vg0 /mnt/gluster').out).toEqual([]);
    s.exec('echo "test replikace" > /mnt/gluster/test.txt');
    expect(s.exec('findmnt /mnt/gluster').out.join()).toMatch(/fuse\.glusterfs/);
    expect(allOk(t.check(s))).toEqual([]);
  });

  it('vzorová řešení nových úloh (příkazy + obsah souborů z editoru)', () => {
    for (const id of ['lx-nfs-server', 'lx-nfs-klient', 'lx-gluster', 'lx-gluster-klient']) {
      const t = task(id);
      const s = t.create();
      expect(allOk(t.check(s)).length, id).toBeGreaterThan(0);
      // řešení: příkazy, „nano soubor“, prázdný řádek, obsah souboru, prázdný řádek, další příkazy
      const lines = t.solution.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^nano (\S+)$/);
        if (m && lines[i + 1] === '') {
          const end = lines.indexOf('', i + 2);
          const block = lines.slice(i + 2, end).join('\n') + '\n';
          s.saveFile(m[1], (s.read(m[1]) ?? '') + block);
          i = end;
        } else if (lines[i]) s.exec(lines[i]);
      }
      expect(allOk(t.check(s)), id).toEqual([]);
    }
    // apt install ssh nainstaluje openssh-server (jako ve cvičení)
    const s = new LinuxSim({});
    s.exec('apt install ssh -y');
    expect(s.packages.has('openssh-server')).toBe(true);
    expect(s.exec('sshd -t').out).toEqual([]);
    expect(s.exec('systemctl reload ssh').out).toEqual([]);
  });
});
