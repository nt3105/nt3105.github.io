#include <stdio.h>
#include <math.h>
int main(){
	int x, n;
	double kq;
	
	do{
		printf("Nhap x:");
		scanf("%d",&x);
		 printf("Nhap n:");
		scanf("%d",&n);
	} while(x<=0 || n <= 0);
	
	kq  = pow(pow(x, 2)+1,n);
	
	printf("Ket qua = %.0f", kq);
	
	return 0; 
}
