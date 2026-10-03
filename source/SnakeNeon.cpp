/* NGAN TU DEV - C++ / Windows. Khong can tai thu vien do hoa ngoai.
   Bien dich bang MinGW (Dev-C++):
   g++ SnakeNeon.cpp -o SnakeNeon.exe -std=c++11 -O2 -mwindows -lgdiplus -lgdi32 -luser32
   Dev-C++: Compiler: -std=c++11
            Linker: -mwindows -lgdiplus -lgdi32 -luser32
   Nut TU CHOI o goc tren ben phai / F2: bat hoac tat tu dong.
   Khi bat: tu an hat, khong dam tuong/than, thang khi day san.
   Khi can, sap lai than theo duong an toan, giu diem va do dai.
   Khi tat: dieu khien bang ban phim. Chuot van dung duoc neu muon.
   Mui ten / WASD: dieu khien ban phim. M: bat/tat che do chuot.
   Chuot: giu chuot trai trong san, ran di ve con tro (4 huong).
   Space: bat dau/tam dung. R: choi lai. Esc: thoat.
*/
#include <deque>
#include <vector>
#include <random>
#include <algorithm>
#include <cmath>
#include <cassert>

struct Cell { int x,y; bool operator==(const Cell& b) const {return x==b.x && y==b.y;} };
const int COLS=30, ROWS=22, TILE=24, BX=30, BY=120, WIDTH=780, HEIGHT=720;
struct Game {
    std::deque<Cell> snake;
    std::vector<Cell> cycle;
    int cycleIndex[ROWS][COLS];
    Cell food, dir, next;
    bool started=false, paused=false, dead=false, won=false, queued=false;
    bool autoPlay=false;
    int score=0, best=0;
    std::mt19937 rng{std::random_device{}()};
    Game(){buildCycle();reset();}
    void buildCycle(){
        // ROWS is even: a closed route visits every cell exactly once.
        // Reserve the rightmost column for the return to the top.
        for(int y=0;y<ROWS;y++) {
            if(y%2==0)for(int x=COLS-2;x>=0;x--)cycle.push_back(Cell{x,y});
            else for(int x=0;x<COLS-1;x++)cycle.push_back(Cell{x,y});
        }
        for(int y=ROWS-1;y>=0;y--)cycle.push_back(Cell{COLS-1,y});
        for(size_t i=0;i<cycle.size();i++)cycleIndex[cycle[i].y][cycle[i].x]=int(i);
    }
    int index(Cell p) const {return cycleIndex[p.y][p.x];}
    int ahead(int from,int to) const {return (to-from+COLS*ROWS)%(COLS*ROWS);}
    bool ordered() const {
        int span=0;
        for(size_t i=1;i<snake.size();i++) {
            int gap=ahead(index(snake[i]),index(snake[i-1]));
            if(gap==0)return false;
            span+=gap;
        }
        return span<COLS*ROWS;
    }
    bool setAuto(bool enabled){
        autoPlay=enabled;queued=false;next=dir;
        if(!enabled)return false;
        if(dead || won)reset();
        started=true;paused=false;
        bool rearranged=!ordered();
        if(rearranged){
            int head=index(snake.front());
            for(size_t i=1;i<snake.size();i++)
                snake[i]=cycle[(head-int(i)+COLS*ROWS)%(COLS*ROWS)];
            // Keep the food unless the rearranged body now covers it.
            if(std::find(snake.begin(),snake.end(),food)!=snake.end())spawn();
        }
        if(snake.size()>1)dir=Cell{snake[0].x-snake[1].x,snake[0].y-snake[1].y};
        next=dir;
        return rearranged;
    }
    Cell autoDirection() const {
        int head=index(snake.front());
        int tailDistance=ahead(head,index(snake.back()));
        int foodDistance=ahead(head,index(food));
        Cell destination=cycle[(head+1)%(COLS*ROWS)];
        int bestAdvance=1;
        const Cell directions[4]={{1,0},{0,1},{-1,0},{0,-1}};
        // Shortcuts stay in the free arc ahead of the head and never
        // pass the food. The cyclic body order is therefore preserved.
        for(int k=0;k<4;k++) {
            Cell p={snake.front().x+directions[k].x,snake.front().y+directions[k].y};
            if(p.x<0 || p.x>=COLS || p.y<0 || p.y>=ROWS)continue;
            int advance=ahead(head,index(p));
            bool safe=advance<tailDistance || (advance==tailDistance && !(p==food));
            if(safe && advance>bestAdvance && advance<=foodDistance){
                bestAdvance=advance;destination=p;
            }
        }
        return Cell{destination.x-snake.front().x,destination.y-snake.front().y};
    }
    void spawn(){
        std::vector<Cell> free;
        for(int y=0;y<ROWS;y++) for(int x=0;x<COLS;x++) {
            Cell p={x,y};
            if(std::find(snake.begin(),snake.end(),p)==snake.end()) free.push_back(p);
        }
        if(free.empty()){won=true;return;}
        food=free[std::uniform_int_distribution<int>(0,int(free.size())-1)(rng)];
    }
    void reset(){snake.clear();for(int i=0;i<5;i++)snake.push_back(Cell{10-i,11});
        dir=next=Cell{1,0};score=0;started=paused=dead=won=queued=false;spawn();}
    void turn(int x,int y){
        if(autoPlay || queued || dead || won || paused || (x==-dir.x && y==-dir.y))return;
        if(x==dir.x && y==dir.y)return;
        next=Cell{x,y};queued=true;
    }
    int interval() const {return std::max(65,155-score*2);}
    void step(){
        if(!started || paused || dead || won)return;
        if(autoPlay)next=autoDirection();
        dir=next;queued=false;
        Cell p={snake.front().x+dir.x,snake.front().y+dir.y};
        bool eat=p==food;
        if(p.x<0 || p.x>=COLS || p.y<0 || p.y>=ROWS){dead=true;return;}
        size_t end=snake.size()-(eat?0:1);
        for(size_t i=0;i<end;i++)if(snake[i]==p){dead=true;return;}
        snake.push_front(p);
        if(eat){score++;best=std::max(best,score);spawn();}else snake.pop_back();
    }
};
#ifdef SNAKE_TEST
int main(){
    Game g;g.started=true;g.food=Cell{11,11};g.step();assert(g.score==1 && g.snake.size()==6);
    g.turn(-1,0);assert(g.next.x==1);g.turn(0,-1);g.turn(-1,0);assert(g.next.y==-1);
    g.step();assert(g.snake.front().y==10);
    g.paused=true;Cell p=g.snake.front();g.step();assert(g.snake.front()==p);
    g.reset();g.started=true;g.snake={Cell{0,0},Cell{1,0}};g.dir=g.next=Cell{-1,0};g.step();assert(g.dead);
    g.reset();g.started=true;g.snake={Cell{1,1},Cell{1,2},Cell{0,2},Cell{0,1}};
    g.dir=g.next=Cell{-1,0};g.food=Cell{9,9};g.step();assert(!g.dead);
    g.reset();g.started=true;g.snake={Cell{1,1},Cell{1,2},Cell{2,2},Cell{2,1},Cell{3,1}};
    g.dir=g.next=Cell{1,0};g.step();assert(g.dead);
    g.reset();g.snake.clear();for(int y=0;y<ROWS;y++)for(int x=0;x<COLS;x++)g.snake.push_back(Cell{x,y});
    g.spawn();assert(g.won);
    return 0;
}
#else
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#include <windowsx.h>
#include <gdiplus.h>
#include <string>
#include <sstream>
using namespace Gdiplus;
Game game;
bool mouseMode=false, holding=false;
POINT target={0,0};
DWORD previous=0;
DWORD rearrangeNotice=0;
float pulse=0;
const int AUTO_X=535, AUTO_Y=69, AUTO_W=215, AUTO_H=36;

void text(Graphics& g,const wchar_t* s,float x,float y,float size,Color c,bool bold=false){
    FontFamily family(L"Segoe UI");Font font(&family,size,bold?FontStyleBold:FontStyleRegular,UnitPixel);
    SolidBrush brush(c);g.DrawString(s,-1,&font,PointF(x,y),&brush);
}
void disk(Graphics& g,float x,float y,float r,Color c){SolidBrush b(c);g.FillEllipse(&b,x-r,y-r,r*2,r*2);}
void rect(Graphics& g,int x,int y,int w,int h,Color c){SolidBrush b(c);g.FillRectangle(&b,x,y,w,h);}
void autoButton(Graphics& g){
    GraphicsPath path;
    const int r=12;
    path.AddArc(AUTO_X,AUTO_Y,r,r,180,90);
    path.AddArc(AUTO_X+AUTO_W-r,AUTO_Y,r,r,270,90);
    path.AddArc(AUTO_X+AUTO_W-r,AUTO_Y+AUTO_H-r,r,r,0,90);
    path.AddArc(AUTO_X,AUTO_Y+AUTO_H-r,r,r,90,90);
    path.CloseFigure();
    SolidBrush fill(game.autoPlay?Color(255,27,94,77):Color(255,37,48,70));
    Pen border(game.autoPlay?Color(255,83,244,194):Color(255,85,103,132),1);
    g.FillPath(&fill,&path);g.DrawPath(&border,&path);
    disk(g,AUTO_X+18.0f,AUTO_Y+18.0f,5.0f,
         game.autoPlay?Color(255,83,244,194):Color(255,148,160,179));
    text(g,game.autoPlay?L"T\u1EF0 CH\u01A0I: B\u1EACT":L"T\u1EF0 CH\u01A0I: T\u1EAET",
         AUTO_X+33.0f,AUTO_Y+7.0f,16,Color(255,237,249,246),true);
}
void toggleAuto(HWND hwnd){
    holding=false;mouseMode=false;ReleaseCapture();
    bool changed=game.setAuto(!game.autoPlay);
    rearrangeNotice=changed?GetTickCount():0;
    previous=GetTickCount();InvalidateRect(hwnd,NULL,FALSE);
}
void steer(){
    if(game.autoPlay || !mouseMode || !holding || game.paused)return;
    float dx=target.x-(BX+game.snake.front().x*TILE+TILE/2);
    float dy=target.y-(BY+game.snake.front().y*TILE+TILE/2);
    if(std::max(std::abs(dx),std::abs(dy))<TILE/2)return;
    if(std::abs(dx)>std::abs(dy))game.turn(dx>0?1:-1,0);
    else game.turn(0,dy>0?1:-1);
}
void draw(Graphics& g){
    g.SetSmoothingMode(SmoothingModeAntiAlias);
    g.SetTextRenderingHint(TextRenderingHintAntiAliasGridFit);
    LinearGradientBrush bg(Point(0,0),Point(WIDTH,HEIGHT),Color(255,11,17,35),Color(255,25,29,56));
    g.FillRectangle(&bg,0,0,WIDTH,HEIGHT);
    text(g,L"NG\u00C2N T\u00DA DEV",30,22,32,Color(255,83,244,194),true);
    const wchar_t* mode=game.autoPlay?L"T\u1EF1 \u0103n h\u1EA1t \u2022 Kh\u00F4ng ch\u1EBFt":
                        mouseMode?L"Gi\u1EEF chu\u1ED9t tr\u00E1i \u0111\u1EC3 di chuy\u1EC3n":
                                  L"B\u00E0n ph\u00EDm: WASD / ph\u00EDm m\u0169i t\u00EAn";
    if(rearrangeNotice && GetTickCount()-rearrangeNotice<3500)
        mode=L"\u0110\u00E3 s\u1EAFp l\u1EA1i th\u00E2n \u2022 Gi\u1EEF nguy\u00EAn \u0111i\u1EC3m";
    text(g,mode,32,73,15,Color(255,141,158,187));
    std::wostringstream points;points<<L"SCORE  "<<game.score<<L"    BEST  "<<game.best;
    text(g,points.str().c_str(),455,29,20,Color(255,242,246,255),true);
    autoButton(g);
    rect(g,BX-3,BY-3,COLS*TILE+6,ROWS*TILE+6,Color(255,47,88,102));
    rect(g,BX,BY,COLS*TILE,ROWS*TILE,Color(255,13,23,39));
    Pen grid(Color(255,23,36,52),1);
    for(int i=1;i<COLS;i++)g.DrawLine(&grid,BX+i*TILE,BY,BX+i*TILE,BY+ROWS*TILE);
    for(int i=1;i<ROWS;i++)g.DrawLine(&grid,BX,BY+i*TILE,BX+COLS*TILE,BY+i*TILE);
    if(!game.won){
        float fx=BX+game.food.x*TILE+12.0f,fy=BY+game.food.y*TILE+12.0f;
        disk(g,fx,fy,17+2*std::sin(pulse),Color(28,255,100,151));
        disk(g,fx,fy,12,Color(50,255,100,151));disk(g,fx,fy,8,Color(255,255,102,143));
        disk(g,fx-2,fy-3,2.5f,Color(255,255,219,224));
    }
    Pen link(Color(255,49,193,158),17);link.SetStartCap(LineCapRound);link.SetEndCap(LineCapRound);
    for(size_t i=1;i<game.snake.size();i++){
        Cell a=game.snake[i-1],b=game.snake[i];
        g.DrawLine(&link,BX+a.x*TILE+12,BY+a.y*TILE+12,BX+b.x*TILE+12,BY+b.y*TILE+12);
    }
    for(int i=int(game.snake.size())-1;i>=0;i--){
        float x=BX+game.snake[i].x*TILE+12.0f,y=BY+game.snake[i].y*TILE+12.0f;
        disk(g,x,y,11,Color(255,65,215,169));disk(g,x-2,y-3,4,Color(65,191,255,220));
    }
    float hx=BX+game.snake.front().x*TILE+12.0f,hy=BY+game.snake.front().y*TILE+12.0f;
    disk(g,hx,hy,12,Color(255,126,255,195));
    for(int s=-1;s<=1;s+=2){float ex=hx+game.dir.x*4-game.dir.y*s*5,ey=hy+game.dir.y*4+game.dir.x*s*5;
        disk(g,ex,ey,3.8f,Color(255,245,255,255));disk(g,ex+game.dir.x,ey+game.dir.y,2,Color(255,12,29,40));}
    text(g,L"F2  Tu choi BAT/TAT     WASD / Mui ten  Di chuyen     SPACE  Tam dung",30,662,15,Color(255,173,189,209));
    text(g,L"M  Chuot     R  Choi lai     ESC  Thoat     Tu choi: an day san de thang",30,687,14,Color(255,141,158,187));
    if(!game.started || game.paused || game.dead || game.won){
        rect(g,BX,BY,COLS*TILE,ROWS*TILE,Color(190,8,14,28));
        rect(g,120,275,540,205,Color(255,26,39,61));
        text(g,game.won?L"YOU WIN!":game.dead?L"GAME OVER":game.paused?L"PAUSED":L"READY TO GROW?",170,302,36,Color(255,126,255,195),true);
        const wchar_t* subtitle=game.dead||game.won?L"Press R or click here to play again":game.paused?L"Press SPACE or click here to resume":L"Press SPACE or click here to start";
        text(g,subtitle,171,363,20,Color(255,245,248,255));
        text(g,L"Mouse: hold left button inside the board.",171,410,16,Color(255,174,191,213));
        text(g,L"F2 / nut TU CHOI: tu an hat, khong chet.",171,438,16,Color(255,174,191,213));
    }
}
void toggle(){if(game.dead||game.won){game.reset();game.started=true;}else if(!game.started)game.started=true;else game.paused=!game.paused;previous=GetTickCount();}
LRESULT CALLBACK proc(HWND hwnd,UINT msg,WPARAM w,LPARAM l){
    switch(msg){
    case WM_CREATE:previous=GetTickCount();SetTimer(hwnd,1,16,NULL);return 0;
    case WM_ERASEBKGND:return 1;
    case WM_KEYDOWN:
        if(w==VK_ESCAPE){DestroyWindow(hwnd);return 0;}
        if((l & (1L<<30)) && (w==VK_SPACE || w==VK_F2 || w=='M' || w=='R'))return 0;
        if(w==VK_F2)toggleAuto(hwnd);
        else if(w==VK_SPACE)toggle();
        else if(w=='R'){game.reset();game.started=game.autoPlay;previous=GetTickCount();holding=false;rearrangeNotice=0;}
        else if(w=='M' && !game.autoPlay){mouseMode=!mouseMode;holding=false;}
        else {int x=0,y=0;
            if(w==VK_UP||w=='W')y=-1;else if(w==VK_DOWN||w=='S')y=1;
            else if(w==VK_LEFT||w=='A')x=-1;else if(w==VK_RIGHT||w=='D')x=1;
            if((x||y) && !game.autoPlay){mouseMode=false;holding=false;game.turn(x,y);}}
        return 0;
    case WM_LBUTTONDOWN:
        target=POINT{GET_X_LPARAM(l),GET_Y_LPARAM(l)};
        if(target.x>=AUTO_X && target.x<AUTO_X+AUTO_W && target.y>=AUTO_Y && target.y<AUTO_Y+AUTO_H){
            SetFocus(hwnd);toggleAuto(hwnd);return 0;
        }
        if(target.x<BX || target.x>=BX+COLS*TILE || target.y<BY || target.y>=BY+ROWS*TILE)return 0;
        SetFocus(hwnd);
        if(!game.started||game.paused||game.dead||game.won){toggle();return 0;}
        if(game.autoPlay)return 0;
        mouseMode=true;holding=true;SetCapture(hwnd);return 0;
    case WM_MOUSEMOVE:target=POINT{GET_X_LPARAM(l),GET_Y_LPARAM(l)};return 0;
    case WM_LBUTTONUP:holding=false;ReleaseCapture();return 0;
    case WM_CAPTURECHANGED:holding=false;return 0;
    case WM_KILLFOCUS:if(game.started&&!game.dead&&!game.won)game.paused=true;holding=false;return 0;
    case WM_TIMER:{DWORD now=GetTickCount();pulse+=0.08f;
        if(now-previous>=DWORD(game.interval())){steer();game.step();previous=now;}
        InvalidateRect(hwnd,NULL,FALSE);return 0;}
    case WM_PAINT:{PAINTSTRUCT ps;HDC dc=BeginPaint(hwnd,&ps);
        {Bitmap buffer(WIDTH,HEIGHT,PixelFormat32bppARGB);Graphics g(&buffer);draw(g);Graphics screen(dc);screen.DrawImage(&buffer,0,0);}
        EndPaint(hwnd,&ps);return 0;}
    case WM_DESTROY:KillTimer(hwnd,1);PostQuitMessage(0);return 0;
    }
    return DefWindowProcW(hwnd,msg,w,l);
}
int WINAPI WinMain(HINSTANCE instance,HINSTANCE,LPSTR,int show){
    ULONG_PTR token;GdiplusStartupInput input;
    if(GdiplusStartup(&token,&input,NULL)!=Ok)return 1;
    int result=0;
    {
        WNDCLASSW wc={};wc.lpfnWndProc=proc;wc.hInstance=instance;wc.lpszClassName=L"SnakeNeonWindow";
        wc.hCursor=LoadCursor(NULL,IDC_ARROW);RegisterClassW(&wc);
        DWORD style=WS_OVERLAPPED|WS_CAPTION|WS_SYSMENU|WS_MINIMIZEBOX;
        RECT r={0,0,WIDTH,HEIGHT};AdjustWindowRect(&r,style,FALSE);
        HWND hwnd=CreateWindowW(wc.lpszClassName,L"NG\u00C2N T\u00DA DEV",style,CW_USEDEFAULT,CW_USEDEFAULT,r.right-r.left,r.bottom-r.top,NULL,NULL,instance,NULL);
        if(!hwnd)result=1;else {ShowWindow(hwnd,show);UpdateWindow(hwnd);MSG msg;
            while(GetMessageW(&msg,NULL,0,0)>0){TranslateMessage(&msg);DispatchMessageW(&msg);}}
    }
    GdiplusShutdown(token);return result;
}
#endif
